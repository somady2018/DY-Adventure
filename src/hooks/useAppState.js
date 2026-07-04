import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadState,
  saveState,
  createInitialState,
  exportStateAsJson,
  clearAllData,
  buildQuestFromTemplate,
  buildCustomQuest,
} from "../storage/state";
import { nowIso } from "../storage/dateUtils";
import { hashPin, verifyPin } from "../storage/pin";
import { QUEST_TEMPLATES } from "../data/definitions";

export function useAppState() {
  const [state, setState] = useState(() => loadState());
  const isFirstRender = useRef(true);

  // 상태가 바뀔 때마다 localStorage에 저장 (최초 마운트 시 중복 저장 방지)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  // 다른 탭/창에서 데이터를 초기화했을 때 동기화 (선택적 안전장치)
  useEffect(() => {
    function handleStorageEvent(e) {
      if (e.key === "adventure.appState.v1" && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          // 무시: 다른 탭에서 깨진 값을 쓴 경우 현재 상태를 유지합니다.
        }
      }
    }
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  // ---------------------------------------------------------
  // PIN 관련
  // ---------------------------------------------------------

  const hasPinSet = !!state.parentPinHash;

  const setupPin = useCallback(async (pin) => {
    const hash = await hashPin(pin);
    setState((prev) => ({ ...prev, parentPinHash: hash }));
  }, []);

  const checkPin = useCallback(async (pin) => {
    if (!state.parentPinHash) return false;
    return verifyPin(pin, state.parentPinHash);
  }, [state.parentPinHash]);

  // ---------------------------------------------------------
  // 퀘스트 배정 (보호자: 추천 템플릿 토글 + 직접 만들기)
  // ---------------------------------------------------------

  const toggleTemplateActive = useCallback((templateId, dateString) => {
    setState((prev) => {
      const isActive = prev.activeTemplateIds.includes(templateId);

      if (isActive) {
        return {
          ...prev,
          activeTemplateIds: prev.activeTemplateIds.filter((id) => id !== templateId),
          assignedQuests: dateString
            ? prev.assignedQuests.filter(
                (q) => !(q.date === dateString && q.templateId === templateId && q.status !== "approved")
              )
            : prev.assignedQuests,
        };
      }

      const activeTemplateIds = [...prev.activeTemplateIds, templateId];
      const template = QUEST_TEMPLATES.find((q) => q.templateId === templateId);
      const alreadyAssigned = dateString && prev.assignedQuests.some(
        (q) => q.date === dateString && q.templateId === templateId
      );
      const assignedQuests = template && dateString && !alreadyAssigned
        ? [...prev.assignedQuests, buildQuestFromTemplate(template, dateString)]
        : prev.assignedQuests;

      return { ...prev, activeTemplateIds, assignedQuests };
    });
  }, []);

  // 활성 템플릿들을 지정한 날짜에 아직 배정되지 않았다면 배정합니다.
  // (앱 시작 시 / 날짜가 바뀌었을 때 자동으로 호출됨)
  const ensureTemplatesAssignedForDate = useCallback((dateString) => {
    setState((prev) => {
      const existingTemplateIdsForDate = new Set(
        prev.assignedQuests
          .filter((q) => q.date === dateString && q.templateId)
          .map((q) => q.templateId)
      );
      const toAdd = prev.activeTemplateIds.filter((tid) => !existingTemplateIdsForDate.has(tid));
      if (toAdd.length === 0) return prev;
      const newQuests = toAdd
        .map((tid) => QUEST_TEMPLATES.find((t) => t.templateId === tid))
        .filter(Boolean)
        .map((template) => buildQuestFromTemplate(template, dateString));
      return { ...prev, assignedQuests: [...prev.assignedQuests, ...newQuests] };
    });
  }, []);

  const assignCustomQuest = useCallback((input) => {
    const quest = buildCustomQuest(input);
    setState((prev) => ({ ...prev, assignedQuests: [...prev.assignedQuests, quest] }));
    return quest;
  }, []);

  // ---------------------------------------------------------
  // 완료 요청 / 승인 / 반려·재도전
  // ---------------------------------------------------------

  // 아이가 "완료했어요"를 누른 시점 — 상태를 pending으로만 바꿉니다. (요구사항 4)
  const submitQuest = useCallback((questId) => {
    setState((prev) => ({
      ...prev,
      assignedQuests: prev.assignedQuests.map((q) =>
        q.id === questId && q.status === "open"
          ? { ...q, status: "pending", submittedAt: nowIso(), retryReason: null }
          : q
      ),
    }));
  }, []);

  // 보호자 승인 — pending 상태인 것만 승인 가능, 한 번만 XP 지급. (요구사항 4)
  const approveQuest = useCallback((questId) => {
    setState((prev) => {
      const target = prev.assignedQuests.find((q) => q.id === questId);
      if (!target || target.status !== "pending") {
        // pending이 아닌 퀘스트는 승인할 수 없습니다. 상태를 바꾸지 않고 그대로 반환.
        return prev;
      }
      const alreadyGranted = target.xpGranted;
      const nextStatXp = alreadyGranted
        ? prev.statXp
        : { ...prev.statXp, [target.statKey]: (prev.statXp[target.statKey] || 0) + target.xp };
      const nextTotalXp = alreadyGranted ? prev.totalXp : prev.totalXp + target.xp;

      return {
        ...prev,
        assignedQuests: prev.assignedQuests.map((q) =>
          q.id === questId
            ? { ...q, status: "approved", approvedAt: nowIso(), xpGranted: true }
            : q
        ),
        statXp: nextStatXp,
        totalXp: nextTotalXp,
        pendingCelebrations: alreadyGranted
          ? prev.pendingCelebrations
          : [...prev.pendingCelebrations, questId],
      };
    });
  }, []);

  // 보호자가 재도전을 요청 — pending을 retry로 되돌리고 이유를 남깁니다.
  const requestRetry = useCallback((questId, reason) => {
    setState((prev) => ({
      ...prev,
      assignedQuests: prev.assignedQuests.map((q) =>
        q.id === questId && q.status === "pending"
          ? { ...q, status: "retry", retryReason: reason || "다시 한 번 해볼까요?" }
          : q
      ),
    }));
  }, []);

  // 아이가 retry 상태의 퀘스트를 다시 시작 (open으로)
  const restartQuest = useCallback((questId) => {
    setState((prev) => ({
      ...prev,
      assignedQuests: prev.assignedQuests.map((q) =>
        q.id === questId && q.status === "retry"
          ? { ...q, status: "open", retryReason: null }
          : q
      ),
    }));
  }, []);

  // 아이 화면에서 보상 애니메이션을 1회 표시한 뒤 큐에서 제거
  const consumeCelebration = useCallback((questId) => {
    setState((prev) => ({
      ...prev,
      pendingCelebrations: prev.pendingCelebrations.filter((id) => id !== questId),
    }));
  }, []);

  // ---------------------------------------------------------
  // 부모 메시지
  // ---------------------------------------------------------

  const sendParentMessage = useCallback((text) => {
    const message = { id: `m_${Date.now()}`, text, createdAt: nowIso(), readAt: null };
    setState((prev) => ({ ...prev, parentMessages: [...prev.parentMessages, message] }));
    return message;
  }, []);

  const markMessageRead = useCallback((messageId) => {
    setState((prev) => ({
      ...prev,
      parentMessages: prev.parentMessages.map((m) =>
        m.id === messageId && !m.readAt ? { ...m, readAt: nowIso() } : m
      ),
    }));
  }, []);

  // ---------------------------------------------------------
  // 데이터 관리 (내보내기 / 초기화)
  // ---------------------------------------------------------

  const exportJson = useCallback(() => exportStateAsJson(state), [state]);

  const resetAllData = useCallback(() => {
    clearAllData();
    setState(createInitialState());
  }, []);

  return {
    state,
    setState,
    hasPinSet,
    setupPin,
    checkPin,
    toggleTemplateActive,
    ensureTemplatesAssignedForDate,
    assignCustomQuest,
    submitQuest,
    approveQuest,
    requestRetry,
    restartQuest,
    consumeCelebration,
    sendParentMessage,
    markMessageRead,
    exportJson,
    resetAllData,
  };
}
