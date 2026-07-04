import { DEFAULT_ACTIVE_TEMPLATE_IDS, STAT_LIST } from "../data/definitions";
import { nowIso } from "./dateUtils";

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "adventure.appState.v1";

// ---------------------------------------------------------
// 초기 상태
// ---------------------------------------------------------

function emptyStatXp() {
  const obj = {};
  STAT_LIST.forEach((s) => { obj[s.key] = 0; });
  return obj;
}

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: nowIso(),

    // 보호자 PIN. null이면 아직 설정 전(최초 실행) 상태입니다.
    parentPinHash: null,

    // 추천 퀘스트 템플릿 중 실제로 "활성"인 것의 templateId 목록.
    // 요구사항 5: 초기값은 8개 전부가 아니라 4개(필수1·선택2·도전1)만.
    activeTemplateIds: [...DEFAULT_ACTIVE_TEMPLATE_IDS],

    // 날짜별로 실제 배정된 퀘스트 인스턴스들.
    // 템플릿(definitions.js)과 분리된 "실제 데이터"입니다.
    // 각 항목: { id, date, templateId|null, type, emoji, title, desc, statKey, xp,
    //           status, createdAt, submittedAt, approvedAt, xpGranted, retryReason }
    assignedQuests: [],

    // 능력치별 누적 XP (스킬트리 잠금해제에 사용)
    statXp: emptyStatXp(),

    // 캐릭터 전체 레벨 계산에 사용되는 총 XP (능력치 합이 아닌 별도 총량)
    totalXp: 0,

    // 부모가 남긴 칭찬 메시지 목록. { id, text, createdAt, readAt }
    parentMessages: [],

    // 아이 화면에서 "다음 진입 시 보상 애니메이션을 1회 보여줘야 하는 퀘스트 id" 큐.
    // 승인 시점에 아이가 앱을 보고 있지 않을 수 있으므로, 별도 큐로 관리합니다.
    pendingCelebrations: [],
  };
}

// ---------------------------------------------------------
// 읽기 / 쓰기
// ---------------------------------------------------------

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return migrateIfNeeded(parsed);
  } catch (err) {
    console.error("저장된 데이터를 불러오지 못해 초기 상태로 시작합니다.", err);
    return createInitialState();
  }
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

// 향후 schemaVersion이 올라갔을 때를 위한 자리. 현재는 v1만 존재하므로
// 누락된 필드를 기본값으로 채워주는 정도만 수행합니다.
function migrateIfNeeded(parsed) {
  const initial = createInitialState();
  if (!parsed || typeof parsed !== "object") return initial;
  return {
    ...initial,
    ...parsed,
    schemaVersion: SCHEMA_VERSION,
    statXp: { ...initial.statXp, ...(parsed.statXp || {}) },
  };
}

export function exportStateAsJson(state) {
  return JSON.stringify(state, null, 2);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------
// 퀘스트 인스턴스 헬퍼
// ---------------------------------------------------------

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
    status: "open", // open | pending | approved | retry | cancelled
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
