import {
  DEFAULT_ACTIVE_TEMPLATE_IDS,
  QUEST_TEMPLATES,
  STAT_LIST,
  SYSTEM_QUEST_TEMPLATES,
  normalizeGuildKey,
} from "../data/definitions";
import { nowIso } from "./dateUtils";

export const SCHEMA_VERSION = 4;
export const STORAGE_KEY = "adventure.appState.v1";

function emptyStatXp() {
  const obj = {};
  STAT_LIST.forEach((s) => { obj[s.key] = 0; });
  return obj;
}

function createSystemQuestTemplates(timestamp = nowIso()) {
  return SYSTEM_QUEST_TEMPLATES.map((template) => ({
    ...template,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function defaultQuestSets() {
  return {
    dailyRequiredTemplateIds: ["base_wash", "base_school_bag"],
    dailyChoiceTemplateIds: ["base_read_15"],
    dailyChallengeTemplateIds: [],
  };
}

function clampTemplateXp(xp) {
  const value = Number(xp);
  if (!Number.isFinite(value)) return 5;
  return Math.min(12, Math.max(4, Math.round(value)));
}

function normalizeQuestTemplate(template, fallbackId, timestamp = nowIso()) {
  const id = template.id || template.templateId || fallbackId || `custom_${Date.now()}`;
  const ability = template.ability || template.statKey || template.rewards?.[0]?.statKey || "life";
  const defaultXp = clampTemplateXp(template.defaultXp ?? template.xp);
  const defaultType = template.defaultType || template.type || "choice";
  return {
    id,
    source: template.source === "system" ? "system" : "custom",
    title: template.title || "새 퀘스트",
    storyTitle: template.storyTitle || template.title || "새로운 임무",
    description: template.description || template.desc || "",
    ability,
    defaultXp,
    defaultType,
    emoji: template.emoji || STAT_LIST.find((s) => s.key === ability)?.emoji || "✨",
    rewards: Array.isArray(template.rewards) ? template.rewards : null,
    guildTone: template.guildTone || "common",
    isActive: template.isActive !== false,
    createdAt: template.createdAt || timestamp,
    updatedAt: template.updatedAt || timestamp,
  };
}

function legacyTemplatesFromCode(timestamp = nowIso()) {
  return QUEST_TEMPLATES.map((template) => normalizeQuestTemplate({
    ...template,
    id: template.templateId,
    source: "custom",
    storyTitle: template.title,
    description: template.desc,
    ability: template.statKey,
    defaultXp: template.xp,
    defaultType: template.type,
    isActive: true,
  }, template.templateId, timestamp));
}

function mergeSystemTemplates(templates, timestamp = nowIso()) {
  const normalized = (Array.isArray(templates) ? templates : [])
    .map((template, index) => normalizeQuestTemplate(template, template.id || `custom_${index}`, timestamp));
  const byId = new Map(normalized.map((template) => [template.id, template]));

  for (const systemTemplate of createSystemQuestTemplates(timestamp)) {
    const existing = byId.get(systemTemplate.id);
    byId.set(systemTemplate.id, existing ? { ...systemTemplate, ...existing, source: "system" } : systemTemplate);
  }

  return Array.from(byId.values());
}

function questSetsFromActiveTemplateIds(activeTemplateIds, templates) {
  const sets = defaultQuestSets();
  if (!Array.isArray(activeTemplateIds) || activeTemplateIds.length === 0) return sets;

  const byId = new Map(templates.map((template) => [template.id, template]));
  return activeTemplateIds.reduce((acc, templateId) => {
    const template = byId.get(templateId);
    if (!template) return acc;
    if (template.defaultType === "required") acc.dailyRequiredTemplateIds.push(templateId);
    else if (template.defaultType === "choice") acc.dailyChoiceTemplateIds.push(templateId);
    else acc.dailyChallengeTemplateIds.push(templateId);
    return acc;
  }, { dailyRequiredTemplateIds: [], dailyChoiceTemplateIds: [], dailyChallengeTemplateIds: [] });
}

function normalizeQuestSets(questSets, templates) {
  const validIds = new Set(templates.map((template) => template.id));
  const fallback = defaultQuestSets();
  const source = questSets && typeof questSets === "object" ? questSets : fallback;
  const clean = (ids) => Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id) => validIds.has(id))));
  return {
    dailyRequiredTemplateIds: clean(source.dailyRequiredTemplateIds),
    dailyChoiceTemplateIds: clean(source.dailyChoiceTemplateIds),
    dailyChallengeTemplateIds: clean(source.dailyChallengeTemplateIds),
  };
}

export function createQuestTemplate(input) {
  const timestamp = nowIso();
  const id = input.id || `custom_${Date.now()}`;
  return normalizeQuestTemplate({
    ...input,
    id,
    source: input.source || "custom",
    createdAt: timestamp,
    updatedAt: timestamp,
  }, id, timestamp);
}

export function updateQuestTemplate(template, input) {
  return normalizeQuestTemplate({
    ...template,
    ...input,
    id: template.id,
    source: template.source,
    createdAt: template.createdAt,
    updatedAt: nowIso(),
  }, template.id);
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
    questTemplates: createSystemQuestTemplates(),
    questSets: defaultQuestSets(),
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
  const timestamp = nowIso();
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

  const legacyTemplates = parsed.questTemplates
    ? parsed.questTemplates
    : [...createSystemQuestTemplates(timestamp), ...legacyTemplatesFromCode(timestamp)];
  next.questTemplates = mergeSystemTemplates(legacyTemplates, timestamp);
  next.questSets = parsed.questSets
    ? normalizeQuestSets(parsed.questSets, next.questTemplates)
    : normalizeQuestSets(questSetsFromActiveTemplateIds(parsed.activeTemplateIds, next.questTemplates), next.questTemplates);

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

export function buildQuestFromTemplate(template, date, overrides = {}) {
  const ability = template.ability || template.statKey || "life";
  const xp = clampTemplateXp(overrides.xp ?? template.defaultXp ?? template.xp);
  const type = overrides.type || template.defaultType || template.type || "choice";
  const description = template.description || template.desc || "";
  const defaultXp = clampTemplateXp(template.defaultXp ?? template.xp);
  const keepTemplateRewards = Array.isArray(template.rewards) && xp === defaultXp;
  return {
    id: generateQuestId(),
    date,
    templateId: template.id || template.templateId,
    type,
    emoji: template.emoji || STAT_LIST.find((s) => s.key === ability)?.emoji || "✨",
    title: template.title,
    storyTitle: template.storyTitle || template.title,
    desc: description,
    description,
    statKey: ability,
    ability,
    xp,
    rewards: keepTemplateRewards ? template.rewards : null,
    status: "open",
    createdAt: nowIso(),
    submittedAt: null,
    approvedAt: null,
    xpGranted: false,
    retryReason: null,
  };
}

export function buildCustomQuest({ emoji, title, storyTitle, desc, description, statKey, ability, xp, type, date, templateId = null }) {
  const resolvedAbility = ability || statKey || "life";
  const resolvedDescription = description || desc || "";
  return {
    id: generateQuestId(),
    date,
    templateId,
    type,
    emoji: emoji || STAT_LIST.find((s) => s.key === resolvedAbility)?.emoji || "✏️",
    title,
    storyTitle: storyTitle || title,
    desc: resolvedDescription,
    description: resolvedDescription,
    statKey: resolvedAbility,
    ability: resolvedAbility,
    xp: clampTemplateXp(xp),
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
