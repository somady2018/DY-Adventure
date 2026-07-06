import { DEFAULT_ACTIVE_TEMPLATE_IDS, STAT_LIST, normalizeGuildKey } from "../data/definitions";
import { nowIso } from "./dateUtils";

export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "adventure.appState.v1";

function emptyStatXp() {
  const obj = {};
  STAT_LIST.forEach((s) => { obj[s.key] = 0; });
  return obj;
}

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: nowIso(),
    profile: null,
    dailyLetter: {
      lastShownDate: null,
      lastMessageId: null,
    },
    parentPinHash: null,
    activeTemplateIds: [...DEFAULT_ACTIVE_TEMPLATE_IDS],
    assignedQuests: [],
    statXp: emptyStatXp(),
    totalXp: 0,
    parentMessages: [],
    pendingCelebrations: [],
    pendingLevelUps: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return parseStateJson(raw);
  } catch (err) {
    console.error("저장된 데이터를 불러오지 못해 초기 상태로 시작합니다.", err);
    return createInitialState();
  }
}

export function parseStateJson(raw) {
  const parsed = JSON.parse(raw);
  return migrateIfNeeded(parsed);
}

export function parseImportedStateJson(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("올바른 데이터 파일이 아니에요.");
  }
  if (!Array.isArray(parsed.assignedQuests) || typeof parsed.statXp !== "object" || parsed.statXp === null) {
    throw new Error("이 앱에서 내보낸 데이터 파일이 아닌 것 같아요.");
  }
  return migrateIfNeeded(parsed);
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("저장 실패", err);
    return false;
  }
}

function migrateIfNeeded(parsed) {
  const initial = createInitialState();
  if (!parsed || typeof parsed !== "object") return initial;
  const next = {
    ...initial,
    ...parsed,
    schemaVersion: SCHEMA_VERSION,
    statXp: { ...initial.statXp, ...(parsed.statXp || {}) },
    dailyLetter: { ...initial.dailyLetter, ...(parsed.dailyLetter || {}) },
  };

  const isLegacyState = !parsed.schemaVersion || parsed.schemaVersion < 2;
  if (!next.profile && isLegacyState) {
    next.profile = {
      childName: "도영",
      guild: "adventurer",
      createdAt: parsed.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
  }

  if (next.profile) {
    next.profile = {
      childName: next.profile.childName || "도영",
      guild: normalizeGuildKey(next.profile.guild),
      createdAt: next.profile.createdAt || parsed.createdAt || nowIso(),
      updatedAt: next.profile.updatedAt || nowIso(),
    };
  }

  if (!Array.isArray(next.pendingLevelUps)) {
    next.pendingLevelUps = [];
  }

  return next;
}

export function exportStateAsJson(state) {
  return JSON.stringify(state, null, 2);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

let idCounter = 0;
export function generateQuestId() {
  idCounter += 1;
  return `q_${Date.now()}_${idCounter}`;
}

export function buildQuestFromTemplate(template, date) {
  return {
    id: generateQuestId(),
    date,
    templateId: template.templateId,
    type: template.type,
    emoji: template.emoji,
    title: template.title,
    desc: template.desc,
    statKey: template.statKey,
    xp: template.xp,
    rewards: Array.isArray(template.rewards) ? template.rewards : null,
    status: "open",
    createdAt: nowIso(),
    submittedAt: null,
    approvedAt: null,
    xpGranted: false,
    retryReason: null,
  };
}

export function buildCustomQuest({ emoji, title, desc, statKey, xp, type, date }) {
  return {
    id: generateQuestId(),
    date,
    templateId: null,
    type,
    emoji: emoji || "✏️",
    title,
    desc,
    statKey,
    xp,
    status: "open",
    createdAt: nowIso(),
    submittedAt: null,
    approvedAt: null,
    xpGranted: false,
    retryReason: null,
  };
}

export function questsForDate(assignedQuests, dateString) {
  return assignedQuests.filter((q) => q.date === dateString);
}
