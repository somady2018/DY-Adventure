import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadState,
  saveState,
  createInitialState,
  exportStateAsJson,
  clearAllData,
  buildQuestFromTemplate,
  buildCustomQuest,
  parseStateJson,
  parseImportedStateJson,
  STORAGE_KEY,
} from "../storage/state";
import { nowIso } from "../storage/dateUtils";
import { hashPin, verifyPin } from "../storage/pin";
import { QUEST_TEMPLATES, getQuestRewards } from "../data/definitions";

export function useAppState() {
  const [state, setState] = useState(() => loadState());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  useEffect(() => {
    function handleStorageEvent(e) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(parseStateJson(e.newValue));
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  const hasPinSet = !!state.parentPinHash;

  const setupPin = useCallback(async (pin) => {
    const hash = await hashPin(pin);
    setState((prev) => ({ ...prev, parentPinHash: hash }));
  }, []);

  const checkPin = useCallback(async (pin) => {
    if (!state.parentPinHash) return false;
    return verifyPin(pin, state.parentPinHash);
  }, [state.parentPinHash]);

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

  const approveQuest = useCallback((questId) => {
    setState((prev) => {
      const target = prev.assignedQuests.find((q) => q.id === questId);
      if (!target || target.status !== "pending") {
        return prev;
      }
      const alreadyGranted = target.xpGranted;
      const rewards = getQuestRewards(target);
      const nextStatXp = alreadyGranted
        ? prev.statXp
        : rewards.reduce(
            (acc, r) => ({ ...acc, [r.statKey]: (acc[r.statKey] || 0) + r.xp }),
            prev.statXp
          );
      const rewardTotalXp = rewards.reduce((sum, r) => sum + r.xp, 0);
      const nextTotalXp = alreadyGranted ? prev.totalXp : prev.totalXp + rewardTotalXp;

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

  const consumeCelebration = useCallback((questId) => {
    setState((prev) => ({
      ...prev,
      pendingCelebrations: prev.pendingCelebrations.filter((id) => id !== questId),
    }));
  }, []);

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

  const exportJson = useCallback(() => exportStateAsJson(state), [state]);

  const resetAllData = useCallback(() => {
    clearAllData();
    setState(createInitialState());
  }, []);

  const importState = useCallback((jsonText) => {
    const next = parseImportedStateJson(jsonText);
    setState(next);
    return next;
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
    importState,
    resetAllData,
  };
}
