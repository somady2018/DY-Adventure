import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadState,
  saveState,
  createInitialState,
  exportStateAsJson,
  clearAllData,
  buildQuestFromTemplate,
  buildCustomQuest,
  createQuestTemplate,
  updateQuestTemplate,
  parseStateJson,
  parseImportedStateJson,
  STORAGE_KEY,
} from "../storage/state";
import { nowIso, weekdayCodeForDateString } from "../storage/dateUtils";
import { clearPinSalt, getPinSalt, hashPin, setPinSalt, verifyPin } from "../storage/pin";
import { characterLevelFromTotalXp, getQuestRewards, normalizeGuildKey } from "../data/definitions";

function repeatDays(template) {
  return Array.isArray(template.repeatDays) && template.repeatDays.length
    ? template.repeatDays
    : ["daily"];
}

function isTemplateForDate(template, dateString) {
  const days = repeatDays(template);
  return days.includes("daily") || days.includes(weekdayCodeForDateString(dateString));
}

function buildMissingScheduledTemplateQuests(state, dateString) {
  const existing = new Set(
    state.assignedQuests
      .filter((quest) => quest.date === dateString && quest.templateId)
      .map((quest) => quest.templateId)
  );

  return state.questTemplates
    .filter((template) => template.isActive !== false)
    .filter((template) => isTemplateForDate(template, dateString))
    .filter((template) => !existing.has(template.id))
    .map((template) => buildQuestFromTemplate(template, dateString, {
      type: template.defaultType,
      xp: template.defaultXp,
    }));
}

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

  const changePin = useCallback(async (currentPin, nextPin) => {
    if (state.parentPinHash) {
      const ok = await verifyPin(currentPin, state.parentPinHash);
      if (!ok) return false;
    }
    const hash = await hashPin(nextPin);
    setState((prev) => ({ ...prev, parentPinHash: hash }));
    return true;
  }, [state.parentPinHash]);

  const resetParentPin = useCallback(() => {
    clearPinSalt();
    setState((prev) => ({ ...prev, parentPinHash: null }));
  }, []);

  const saveProfile = useCallback(({ childName, guild }) => {
    const trimmedName = (childName || "").trim() || "도영";
    const safeGuild = normalizeGuildKey(guild);
    setState((prev) => {
      const createdAt = prev.profile?.createdAt || nowIso();
      return {
        ...prev,
        profile: {
          childName: trimmedName,
          guild: safeGuild,
          createdAt,
          updatedAt: nowIso(),
        },
      };
    });
  }, []);

  const markDailyLetterShown = useCallback((dateString, messageId) => {
    setState((prev) => ({
      ...prev,
      dailyLetter: {
        ...(prev.dailyLetter || {}),
        lastShownDate: dateString,
        lastMessageId: messageId,
      },
    }));
  }, []);

  const saveQuestTemplate = useCallback((input) => {
    let saved = null;
    setState((prev) => {
      const existing = prev.questTemplates.find((template) => template.id === input.id);
      saved = existing ? updateQuestTemplate(existing, input) : createQuestTemplate(input);
      return {
        ...prev,
        questTemplates: existing
          ? prev.questTemplates.map((template) => (template.id === saved.id ? saved : template))
          : [...prev.questTemplates, saved],
      };
    });
    return saved;
  }, []);

  const toggleQuestTemplateActive = useCallback((templateId) => {
    setState((prev) => ({
      ...prev,
      questTemplates: prev.questTemplates.map((template) =>
        template.id === templateId ? { ...template, isActive: !template.isActive, updatedAt: nowIso() } : template
      ),
    }));
  }, []);

  const deleteQuestTemplate = useCallback((templateId) => {
    let deleted = false;
    setState((prev) => {
      const target = prev.questTemplates.find((template) => template.id === templateId);
      if (!target || target.source === "system") return prev;
      deleted = true;
      const removeId = (ids) => ids.filter((id) => id !== templateId);
      return {
        ...prev,
        questTemplates: prev.questTemplates.filter((template) => template.id !== templateId),
        questSets: {
          dailyRequiredTemplateIds: removeId(prev.questSets.dailyRequiredTemplateIds),
          dailyChoiceTemplateIds: removeId(prev.questSets.dailyChoiceTemplateIds),
          dailyChallengeTemplateIds: removeId(prev.questSets.dailyChallengeTemplateIds),
        },
      };
    });
    return deleted;
  }, []);

  const setQuestSetMembership = useCallback((setKey, templateId, included) => {
    setState((prev) => {
      if (!prev.questTemplates.some((template) => template.id === templateId)) return prev;
      const current = prev.questSets[setKey] || [];
      const nextIds = included
        ? Array.from(new Set([...current, templateId]))
        : current.filter((id) => id !== templateId);
      return {
        ...prev,
        questSets: {
          ...prev.questSets,
          [setKey]: nextIds,
        },
      };
    });
  }, []);

  const assignTemplateQuest = useCallback((templateId, dateString, options = {}) => {
    let result = { ok: false, reason: "missing" };
    setState((prev) => {
      const template = prev.questTemplates.find((item) => item.id === templateId);
      if (!template) return prev;
      const alreadyAssigned = prev.assignedQuests.some(
        (quest) => quest.date === dateString && quest.templateId === templateId
      );
      if (alreadyAssigned) {
        result = { ok: false, reason: "duplicate", template };
        return prev;
      }
      const quest = buildQuestFromTemplate(template, dateString, options);
      result = { ok: true, quest, template };
      return { ...prev, assignedQuests: [...prev.assignedQuests, quest] };
    });
    return result;
  }, []);

  const assignTemplateQuests = useCallback((templateIds, dateString) => {
    let result = { added: 0, duplicates: 0 };
    setState((prev) => {
      const selectedIds = Array.from(new Set(Array.isArray(templateIds) ? templateIds : []));
      if (selectedIds.length === 0) return prev;

      const existing = new Set(
        prev.assignedQuests
          .filter((quest) => quest.date === dateString && quest.templateId)
          .map((quest) => quest.templateId)
      );
      const templates = new Map(prev.questTemplates.map((template) => [template.id, template]));
      const newQuests = [];
      let duplicates = 0;

      selectedIds.forEach((templateId) => {
        const template = templates.get(templateId);
        if (!template || template.isActive === false) return;
        if (existing.has(templateId)) {
          duplicates += 1;
          return;
        }
        existing.add(templateId);
        newQuests.push(buildQuestFromTemplate(template, dateString, {
          type: template.defaultType,
          xp: template.defaultXp,
        }));
      });

      result = { added: newQuests.length, duplicates };
      if (newQuests.length === 0) return prev;
      return { ...prev, assignedQuests: [...prev.assignedQuests, ...newQuests] };
    });
    return result;
  }, []);

  const removeTemplateQuestForDate = useCallback((templateId, dateString) => {
    let result = { ok: false, reason: "missing" };
    setState((prev) => {
      const target = prev.assignedQuests.find(
        (quest) => quest.date === dateString && quest.templateId === templateId
      );
      if (!target) return prev;
      if (target.status !== "open") {
        result = { ok: false, reason: "locked", quest: target };
        return prev;
      }
      result = { ok: true, quest: target };
      return {
        ...prev,
        assignedQuests: prev.assignedQuests.filter((quest) => quest.id !== target.id),
      };
    });
    return result;
  }, []);

  const assignQuestSet = useCallback((dateString) => {
    let result = { added: 0, duplicates: 0 };
    setState((prev) => {
      const groups = [
        ["dailyRequiredTemplateIds", "required"],
        ["dailyChoiceTemplateIds", "choice"],
        ["dailyChallengeTemplateIds", "challenge"],
      ];
      const existing = new Set(
        prev.assignedQuests
          .filter((quest) => quest.date === dateString && quest.templateId)
          .map((quest) => quest.templateId)
      );
      const templates = new Map(prev.questTemplates.map((template) => [template.id, template]));
      const newQuests = [];
      let duplicates = 0;

      groups.forEach(([setKey, type]) => {
        (prev.questSets[setKey] || []).forEach((templateId) => {
          const template = templates.get(templateId);
          if (!template || template.isActive === false) return;
          if (existing.has(templateId)) {
            duplicates += 1;
            return;
          }
          existing.add(templateId);
          newQuests.push(buildQuestFromTemplate(template, dateString, { type }));
        });
      });

      result = { added: newQuests.length, duplicates };
      if (newQuests.length === 0) return prev;
      return { ...prev, assignedQuests: [...prev.assignedQuests, ...newQuests] };
    });
    return result;
  }, []);

  const toggleTemplateActive = useCallback((templateId) => {
    toggleQuestTemplateActive(templateId);
  }, [toggleQuestTemplateActive]);

  const ensureTemplatesAssignedForDate = useCallback((dateString) => {
    if (!dateString) return;
    setState((prev) => {
      const newQuests = buildMissingScheduledTemplateQuests(prev, dateString);
      if (newQuests.length === 0) return prev;
      return { ...prev, assignedQuests: [...prev.assignedQuests, ...newQuests] };
    });
  }, []);

  const assignCustomQuest = useCallback((input) => {
    let savedTemplate = null;
    let quest = null;
    setState((prev) => {
      let nextTemplates = prev.questTemplates;
      let templateId = null;

      if (input.saveAsTemplate) {
        savedTemplate = createQuestTemplate({
          title: input.title,
          storyTitle: input.storyTitle,
          description: input.description || input.desc,
          ability: input.ability || input.statKey,
          defaultXp: input.xp,
          defaultType: input.type,
          emoji: input.emoji,
          isActive: true,
        });
        templateId = savedTemplate.id;
        nextTemplates = [...prev.questTemplates, savedTemplate];
      }

      quest = buildCustomQuest({ ...input, templateId });
      return { ...prev, questTemplates: nextTemplates, assignedQuests: [...prev.assignedQuests, quest] };
    });
    return { quest, template: savedTemplate };
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
      const beforeLevel = characterLevelFromTotalXp(prev.totalXp).level;
      const afterLevel = characterLevelFromTotalXp(nextTotalXp).level;
      const pendingLevelUps = !alreadyGranted && afterLevel > beforeLevel
        ? [...(prev.pendingLevelUps || []), { id: `lvl_${Date.now()}_${afterLevel}`, level: afterLevel, createdAt: nowIso() }]
        : (prev.pendingLevelUps || []);

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
        pendingLevelUps,
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

  const consumeLevelUp = useCallback((levelUpId) => {
    setState((prev) => ({
      ...prev,
      pendingLevelUps: (prev.pendingLevelUps || []).filter((item) => item.id !== levelUpId),
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

  const exportJson = useCallback(() => {
    const backup = JSON.parse(exportStateAsJson(state));
    const pinSalt = getPinSalt();
    backup.backupVersion = 2;
    if (pinSalt) backup.pinSalt = pinSalt;
    return JSON.stringify(backup, null, 2);
  }, [state]);

  const resetAllData = useCallback(() => {
    clearAllData();
    clearPinSalt();
    setState(createInitialState());
  }, []);

  const importState = useCallback((jsonText) => {
    const next = parseImportedStateJson(jsonText);
    const parsed = JSON.parse(jsonText);
    if (next.parentPinHash && typeof parsed.pinSalt === "string" && parsed.pinSalt) {
      setPinSalt(parsed.pinSalt);
    } else if (!next.parentPinHash) {
      clearPinSalt();
    }
    setState(next);
    return next;
  }, []);

  return {
    state,
    setState,
    hasPinSet,
    setupPin,
    checkPin,
    changePin,
    resetParentPin,
    saveProfile,
    markDailyLetterShown,
    saveQuestTemplate,
    toggleQuestTemplateActive,
    deleteQuestTemplate,
    setQuestSetMembership,
    assignTemplateQuest,
    assignTemplateQuests,
    removeTemplateQuestForDate,
    assignQuestSet,
    toggleTemplateActive,
    ensureTemplatesAssignedForDate,
    assignCustomQuest,
    submitQuest,
    approveQuest,
    requestRetry,
    restartQuest,
    consumeCelebration,
    consumeLevelUp,
    sendParentMessage,
    markMessageRead,
    exportJson,
    importState,
    resetAllData,
  };
}
