import {
  DEFAULT_ACTIVE_TEMPLATE_IDS,
  QUEST_TEMPLATES,
  REPEAT_DAY_OPTIONS,
  STAT_LIST,
  SYSTEM_QUEST_TEMPLATES,
  normalizeGuildKey,
} from "../data/definitions";
import { nowIso } from "./dateUtils";
import { mirrorRemove, mirrorSet } from "./nativeMirror";

export const SCHEMA_VERSION = 9;
export const STORAGE_KEY = "adventure.appState.v1";

const VALID_TEMPLATE_TYPES = new Set(["required", "choice", "challenge", "bonus"]);
const VALID_REPEAT_DAYS = new Set(REPEAT_DAY_OPTIONS.map((option) => option.key));
const SYSTEM_TEMPLATE_NAMES = new Map(
  SYSTEM_QUEST_TEMPLATES.map((template) => [
    template.id,
    { title: template.title },
  ])
);

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

// 분할 보상의 개별 XP는 템플릿 기본 XP(4~12)보다 작게 나눌 수 있어야 하므로
// 별도의 범위(1~12)를 사용합니다.
function clampRewardXp(xp) {
  const value = Number(xp);
  if (!Number.isFinite(value)) return 2;
  return Math.min(12, Math.max(1, Math.round(value)));
}

const VALID_STAT_KEYS = new Set(STAT_LIST.map((stat) => stat.key));

// 보상이 2개 이상일 때만 "분할 보상"으로 인정합니다.
// (1개짜리 rewards는 단일 statKey/xp와 같은 의미이므로 정규화 단계에서 버립니다.)
function normalizeTemplateRewards(rewards) {
  if (!Array.isArray(rewards)) return null;
  const clean = rewards
    .filter((reward) => reward && VALID_STAT_KEYS.has(reward.statKey))
    .map((reward) => ({ statKey: reward.statKey, xp: clampRewardXp(reward.xp) }));
  return clean.length >= 2 ? clean : null;
}

function rewardsTotalXp(rewards) {
  return rewards.reduce((sum, reward) => sum + reward.xp, 0);
}

export function normalizeRepeatDays(days) {
  if (!Array.isArray(days) || days.length === 0) return ["daily"];
  const clean = Array.from(new Set(days.filter((day) => VALID_REPEAT_DAYS.has(day))));
  if (clean.includes("daily")) return ["daily"];
  return clean.length ? clean : ["daily"];
}

function normalizeQuestTemplate(template, fallbackId, timestamp = nowIso()) {
  const id = template.id || template.templateId || fallbackId || `custom_${Date.now()}`;
  const rewards = normalizeTemplateRewards(template.rewards);
  // 분할 보상이 있으면 대표 능력치는 첫 번째 보상, 기본 XP는 보상 합계로 통일
  const ability = rewards
    ? rewards[0].statKey
    : template.ability || template.statKey || "life";
  const defaultXp = rewards
    ? rewardsTotalXp(rewards)
    : clampTemplateXp(template.defaultXp ?? template.xp);
  const typeCandidate = template.defaultType || template.type;
  const defaultType = VALID_TEMPLATE_TYPES.has(typeCandidate) ? typeCandidate : "choice";
  return {
    id,
    source: template.source === "system" ? "system" : "custom",
    title: template.title || "새 퀘스트",
    description: template.description || template.desc || "",
    ability,
    defaultXp,
    defaultType,
    repeatDays: normalizeRepeatDays(template.repeatDays),
    emoji: template.emoji || STAT_LIST.find((s) => s.key === ability)?.emoji || "✨",
    rewards,
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
    description: template.desc,
    ability: template.statKey,
    defaultXp: template.xp,
    defaultType: template.type,
    repeatDays: ["daily"],
    isActive: true,
  }, template.templateId, timestamp));
}

function mergeSystemTemplates(templates, timestamp = nowIso()) {
  const normalized = (Array.isArray(templates) ? templates : [])
    .map((template, index) => normalizeQuestTemplate(template, template.id || `custom_${index}`, timestamp));
  const byId = new Map(normalized.map((template) => [template.id, template]));

  for (const systemTemplate of createSystemQuestTemplates(timestamp)) {
    const existing = byId.get(systemTemplate.id);
    const syncedNames = SYSTEM_TEMPLATE_NAMES.get(systemTemplate.id);
    byId.set(systemTemplate.id, existing ? {
      ...systemTemplate,
      ...existing,
      ...syncedNames,
      source: "system",
    } : systemTemplate);
  }

  return Array.from(byId.values());
}

function syncSystemQuestNames(quests) {
  if (!Array.isArray(quests)) return [];
  return quests.map((quest) => {
    const syncedNames = SYSTEM_TEMPLATE_NAMES.get(quest.templateId);
    return syncedNames ? { ...quest, ...syncedNames } : quest;
  });
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
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("올바른 데이터 파일이 아니에요.");
  }
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
    const json = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, json);
    mirrorSet(STORAGE_KEY, json);
    return true;
  } catch (err) {
    console.error("저장 실패", err);
    return false;
  }
}

function migrateIfNeeded(parsed) {
  const initial = createInitialState();
  if (!parsed || typeof parsed !== "object") return initial;
  const stateFields = { ...parsed };
  delete stateFields.pinSalt;
  delete stateFields.backupVersion;
  const timestamp = nowIso();
  const next = {
    ...initial,
    ...stateFields,
    schemaVersion: SCHEMA_VERSION,
    statXp: { ...initial.statXp, ...(stateFields.statXp || {}) },
    dailyLetter: { ...initial.dailyLetter, ...(stateFields.dailyLetter || {}) },
  };

  const isLegacyState = !stateFields.schemaVersion || stateFields.schemaVersion < 2;
  if (!next.profile && isLegacyState) {
    next.profile = {
      childName: "도영",
      guild: "adventurer",
      createdAt: stateFields.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
  }

  if (next.profile) {
    next.profile = {
      childName: next.profile.childName || "도영",
      guild: normalizeGuildKey(next.profile.guild),
      createdAt: next.profile.createdAt || stateFields.createdAt || nowIso(),
      updatedAt: next.profile.updatedAt || nowIso(),
    };
  }

  if (!Array.isArray(next.pendingLevelUps)) {
    next.pendingLevelUps = [];
  }

  const legacyTemplates = stateFields.questTemplates
    ? stateFields.questTemplates
    : [...createSystemQuestTemplates(timestamp), ...legacyTemplatesFromCode(timestamp)];
  next.questTemplates = mergeSystemTemplates(legacyTemplates, timestamp);
  next.questSets = stateFields.questSets
    ? normalizeQuestSets(stateFields.questSets, next.questTemplates)
    : normalizeQuestSets(questSetsFromActiveTemplateIds(stateFields.activeTemplateIds, next.questTemplates), next.questTemplates);
  next.assignedQuests = syncSystemQuestNames(next.assignedQuests);
  repairSplitRewards(next, timestamp);

  const originalSchemaVersion = Number(stateFields.schemaVersion) || 0;
  if (originalSchemaVersion < 9) {
    syncSystemTemplateContentV9(next, timestamp);
  }

  return next;
}

// 스키마 9 마이그레이션(1회성): 기본 제공 템플릿 6종의 내용(설명, 보상 구성)을
// 새 기준으로 재정리했으므로, 스키마 9 미만의 저장 데이터에는 코드의 최신 내용을
// 한 번 동기화합니다. 사용자의 활성/반복/종류 설정은 유지하며, 스키마 9 이후에
// 사용자가 시스템 템플릿을 직접 수정한 내용은 다시 덮어쓰지 않습니다.
function syncSystemTemplateContentV9(next, timestamp) {
  const codeById = new Map(SYSTEM_QUEST_TEMPLATES.map((template) => [template.id, template]));

  next.questTemplates = next.questTemplates.map((template) => {
    const code = codeById.get(template.id);
    if (!code) return template;
    const rewards = normalizeTemplateRewards(code.rewards);
    return {
      ...template,
      title: code.title,
      description: code.description,
      emoji: code.emoji,
      ability: rewards ? rewards[0].statKey : code.ability,
      defaultXp: rewards ? rewardsTotalXp(rewards) : clampTemplateXp(code.defaultXp),
      rewards,
      updatedAt: timestamp,
    };
  });

  // 아직 승인 전인 시스템 템플릿 퀘스트도 새 내용으로 맞춥니다.
  next.assignedQuests = next.assignedQuests.map((quest) => {
    const code = codeById.get(quest.templateId);
    if (!code || quest.xpGranted) return quest;
    if (quest.status !== "open" && quest.status !== "pending") return quest;
    const rewards = normalizeTemplateRewards(code.rewards);
    const ability = rewards ? rewards[0].statKey : code.ability;
    return {
      ...quest,
      title: code.title,
      desc: code.description,
      description: code.description,
      emoji: code.emoji,
      statKey: ability,
      ability,
      xp: rewards ? rewardsTotalXp(rewards) : clampTemplateXp(code.defaultXp),
      rewards,
    };
  });
}

// 스키마 8 마이그레이션: 코드에 분할 보상(rewards)이 정의된 레거시 템플릿
// (t11 "영어가 술술", t12 "수학천재가 될테다")이 예전 저장 데이터에는 rewards 없이
// 남아 있어, 실제로는 단일 보상만 지급되던 문제를 복구합니다.
// 사용자가 능력치를 직접 바꾼 템플릿은 의도를 존중해 건드리지 않습니다.
function repairSplitRewards(next, timestamp) {
  const codeSplitTemplates = new Map(
    QUEST_TEMPLATES
      .filter((template) => Array.isArray(template.rewards) && template.rewards.length >= 2)
      .map((template) => [template.templateId, template])
  );
  if (codeSplitTemplates.size === 0) return;

  next.questTemplates = next.questTemplates.map((template) => {
    const code = codeSplitTemplates.get(template.id);
    if (!code || template.rewards || template.ability !== code.statKey) return template;
    const rewards = normalizeTemplateRewards(code.rewards);
    if (!rewards) return template;
    return { ...template, rewards, defaultXp: rewardsTotalXp(rewards), updatedAt: timestamp };
  });

  // 아직 승인 전인 오늘 퀘스트도 같은 기준으로 복구 (지급된 XP는 소급하지 않음)
  next.assignedQuests = next.assignedQuests.map((quest) => {
    const code = codeSplitTemplates.get(quest.templateId);
    if (!code || quest.rewards || quest.xpGranted) return quest;
    if (quest.status !== "open" && quest.status !== "pending") return quest;
    if ((quest.statKey || quest.ability) !== code.statKey) return quest;
    const rewards = normalizeTemplateRewards(code.rewards);
    if (!rewards) return quest;
    return { ...quest, rewards, xp: rewardsTotalXp(rewards) };
  });
}

export function exportStateAsJson(state) {
  return JSON.stringify(state, null, 2);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  mirrorRemove(STORAGE_KEY);
}

let idCounter = 0;
export function generateQuestId() {
  idCounter += 1;
  return `q_${Date.now()}_${idCounter}`;
}

export function buildQuestFromTemplate(template, date, overrides = {}) {
  const templateRewards = normalizeTemplateRewards(template.rewards);
  const ability = templateRewards
    ? templateRewards[0].statKey
    : template.ability || template.statKey || "life";
  const type = overrides.type || template.defaultType || template.type || "choice";
  const description = template.description || template.desc || "";

  // 분할 보상 템플릿은 XP를 따로 바꾸지 않는 한(또는 합계와 같게 지정한 경우)
  // 보상 배열을 그대로 유지하고, quest.xp는 항상 보상 합계와 일치시킵니다.
  // XP를 다르게 지정하면 대표 능력치 단일 보상으로 대체됩니다.
  const rewardsSum = templateRewards ? rewardsTotalXp(templateRewards) : null;
  const keepTemplateRewards =
    templateRewards && (overrides.xp == null || Number(overrides.xp) === rewardsSum);
  const xp = keepTemplateRewards
    ? rewardsSum
    : clampTemplateXp(overrides.xp ?? template.defaultXp ?? template.xp);
  return {
    id: generateQuestId(),
    date,
    templateId: template.id || template.templateId,
    type,
    emoji: template.emoji || STAT_LIST.find((s) => s.key === ability)?.emoji || "✨",
    title: template.title,
    desc: description,
    description,
    statKey: ability,
    ability,
    xp,
    rewards: keepTemplateRewards ? templateRewards : null,
    status: "open",
    createdAt: nowIso(),
    submittedAt: null,
    approvedAt: null,
    xpGranted: false,
    retryReason: null,
  };
}

export function buildCustomQuest({ emoji, title, desc, description, statKey, ability, xp, type, date, templateId = null }) {
  const resolvedAbility = ability || statKey || "life";
  const resolvedDescription = description || desc || "";
  return {
    id: generateQuestId(),
    date,
    templateId,
    type,
    emoji: emoji || STAT_LIST.find((s) => s.key === resolvedAbility)?.emoji || "✏️",
    title,
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
