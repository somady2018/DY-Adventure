// 능력치, 스킬, 퀘스트 "템플릿"(추천 목록) 등 변하지 않는 정의만 모아둔 파일입니다.
// 실제 그날그날 배정된 퀘스트, 진행 상태, 경험치는 storage/state.js 쪽에서 다룹니다.

export const STATS = {
  life: { key: "life", name: "생활력", emoji: "🎒", color: "#5B7B5A", light: "#E4ECDD", desc: "스스로 챙기고 정리하는 힘" },
  knowledge: { key: "knowledge", name: "지식", emoji: "📖", color: "#3C5878", light: "#E1E9F0", desc: "읽고 배우며 쌓이는 힘" },
  curiosity: { key: "curiosity", name: "탐구력", emoji: "🔍", color: "#D98E3A", light: "#FBE9CF", desc: "관찰하고 질문하는 힘" },
  grit: { key: "grit", name: "끈기", emoji: "🔥", color: "#C75D4D", light: "#F6DFD9", desc: "다시 도전하는 힘" },
  courage: { key: "courage", name: "용기", emoji: "⚔️", color: "#8E5BA6", light: "#EBE1F0", desc: "표현하고 시도하는 힘" },
  teamwork: { key: "teamwork", name: "협동력", emoji: "🤝", color: "#3D8E8E", light: "#DCEFEF", desc: "함께 돕고 나누는 힘" },
  heart: { key: "heart", name: "마음력", emoji: "💛", color: "#C9A227", light: "#F7EFCB", desc: "마음을 알아채고 쉬는 힘" },
};

export const STAT_LIST = Object.values(STATS);
export const MAX_LEVEL = 50;

// 능력치 레벨: 능력치별 XP가 누적되는 작은 단위 (스킬트리 잠금해제 기준)
export function levelFromXp(xp) {
  let level = 1;
  let remaining = xp;
  let need = 20;
  while (remaining >= need && level < MAX_LEVEL) {
    remaining -= need;
    level += 1;
    need = 20 + (level - 1) * 8;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, into: need, need };
  }
  return { level, into: remaining, need };
}

// 캐릭터 전체 레벨: 능력치 레벨의 합이 아니라, 모든 퀘스트 보상의 총합(totalXp) 기준.
// 요구사항 6: "총 XP가 0이면 반드시 Lv.1 견습 탐험가" 를 보장하기 위해
// 레벨 1 진입에 필요한 첫 구간 임계값을 0으로 둡니다.
export function characterLevelFromTotalXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  let need = 40; // 캐릭터 레벨은 능력치보다 더 천천히 오르도록 더 큰 임계값 사용
  while (remaining >= need && level < MAX_LEVEL) {
    remaining -= need;
    level += 1;
    need = 40 + (level - 1) * 15;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, into: need, need };
  }
  return { level, into: remaining, need };
}

export const SKILLS = [
  { id: "bag-master", statKey: "life", levelReq: 3, name: "가방 마스터", emoji: "🎒", desc: "이제 준비물을 잊지 않아요" },
  { id: "clean-routine", statKey: "life", levelReq: 8, name: "생활 루틴 장인", emoji: "🧼", desc: "스스로 씻고 정리하는 힘이 자랐어요" },
  { id: "page-turner", statKey: "knowledge", levelReq: 3, name: "책장 넘기는 자", emoji: "📚", desc: "이야기 속에 푹 빠질 수 있어요" },
  { id: "word-collector", statKey: "knowledge", levelReq: 8, name: "단어 수집가", emoji: "📝", desc: "새로운 말을 차곡차곡 모아요" },
  { id: "tiny-researcher", statKey: "curiosity", levelReq: 4, name: "작은 연구원", emoji: "🔬", desc: "작은 변화도 알아채는 눈을 가졌어요" },
  { id: "observer-eye", statKey: "curiosity", levelReq: 8, name: "관찰자의 눈", emoji: "👁️", desc: "아무도 못 본 걸 발견해요" },
  { id: "try-again", statKey: "grit", levelReq: 4, name: "다시 한번!", emoji: "💪", desc: "어려운 일도 포기하지 않아요" },
  { id: "steady-climber", statKey: "grit", levelReq: 8, name: "차근차근 등반가", emoji: "⛰️", desc: "천천히라도 끝까지 올라가요" },
  { id: "brave-speaker", statKey: "courage", levelReq: 4, name: "용감한 말솜씨", emoji: "📢", desc: "먼저 말 걸고, 먼저 사과해요" },
  { id: "first-step-hero", statKey: "courage", levelReq: 8, name: "첫걸음 용사", emoji: "🚀", desc: "낯선 일에도 한 걸음 다가가요" },
  { id: "home-guardian", statKey: "teamwork", levelReq: 4, name: "우리 집 수호대", emoji: "🛡️", desc: "가족을 먼저 도와요" },
  { id: "helping-hand", statKey: "teamwork", levelReq: 8, name: "도움의 손", emoji: "🤲", desc: "필요한 순간에 먼저 도와요" },
  { id: "emotion-translator", statKey: "heart", levelReq: 4, name: "감정 통역사", emoji: "💬", desc: "내 마음을 말로 표현할 수 있어요" },
  { id: "warm-listener", statKey: "heart", levelReq: 8, name: "따뜻한 경청가", emoji: "💛", desc: "내 마음과 다른 사람의 마음을 함께 들어요" },
];

export const CHARACTER_TITLES = [
  { minLevel: 1, title: "견습 탐험가" },
  { minLevel: 5, title: "반짝 새싹 탐험가" },
  { minLevel: 10, title: "숲길 관찰자" },
  { minLevel: 15, title: "작은 연구 대장" },
  { minLevel: 20, title: "용감한 도전가" },
  { minLevel: 25, title: "따뜻한 마음 지킴이" },
  { minLevel: 30, title: "지혜로운 길잡이" },
  { minLevel: 35, title: "반짝이는 문제 해결사" },
  { minLevel: 40, title: "우리 집 모험 대장" },
  { minLevel: 45, title: "꿈을 키우는 탐험가" },
  { minLevel: 50, title: "전설의 어린 모험가" },
];

export function characterTitle(level) {
  let best = CHARACTER_TITLES[0].title;
  for (const t of CHARACTER_TITLES) {
    if (level >= t.minLevel) best = t.title;
  }
  return best;
}

// 퀘스트 종류: required(필수) / choice(선택) / challenge(도전) / bonus(보너스, 구 secret)
// 요구사항 8: 화면에 노출되는 secret 퀘스트는 명칭만 "보너스 퀘스트"로 바꾸고,
// 진짜 "조건부로 나타나는 비밀 퀘스트" 로직은 이번 버전에 구현하지 않습니다.
export const QUEST_TYPE_LABEL = {
  required: "필수 퀘스트",
  choice: "선택 퀘스트",
  challenge: "도전 퀘스트",
  bonus: "보너스 퀘스트",
};

// 추천 퀘스트 "템플릿" 목록 — 보호자가 등록 화면에서 체크/해제하는 후보들입니다.
// 템플릿 자체는 그날의 실제 배정 퀘스트(assignedQuests)와 분리되어 있습니다.
export const QUEST_TEMPLATES = [
  { templateId: "t1", type: "required", emoji: "🎒", title: "출발 준비의 주문", desc: "학교 준비물을 직접 확인하세요.", statKey: "life", xp: 5 },
  { templateId: "t2", type: "choice", emoji: "🔍", title: "관찰자의 눈", desc: "사슴벌레나 화분에게 필요한게 있을지 확인해요.", statKey: "curiosity", xp: 8 },
  { templateId: "t3", type: "choice", emoji: "📖", title: "마법 도서관 탐험", desc: "책을 15분 읽으세요.", statKey: "knowledge", xp: 6 },
  { templateId: "t4", type: "challenge", emoji: "✍️", title: "문장의 마술사", desc: "오늘 기억에 남는 일을 한 문장으로 적으세요.", statKey: "courage", xp: 10 },
  { templateId: "t5", type: "required", emoji: "👕", title: "나도 할 수 있다", desc: "벗은 옷을 빨래 통에 정리해요.", statKey: "life", xp: 4 },
  { templateId: "t6", type: "choice", emoji: "💯", title: "힘들어도 한번 더", desc: "틀렸던 문제 다시 공부합시다.", statKey: "grit", xp: 9 },
  { templateId: "t7", type: "bonus", emoji: "✨", title: "숨겨진 친절", desc: "부모님의 심부름을 해보아요.", statKey: "teamwork", xp: 10 },
  { templateId: "t8", type: "bonus", emoji: "🌿", title: "마음을 말하는 연습", desc: "내 마음을 차근차근 말로 설명해요.", statKey: "heart", xp: 10 },
  { templateId: "t9", type: "required", emoji: "🛁", title: "스스로 씻기", desc: "구석구석 깨끗히 씻어봐요.", statKey: "life", xp: 5 },
  { templateId: "t10", type: "challenge", emoji: "🥰", title: "주어진 밥 다먹기", desc: "아빠에게 합격을 받아보자.", statKey: "life", xp: 5 },
  { templateId: "t11", type: "choice", emoji: "📖", title: "영어가 술술", desc: "이번 링키 Top10은 나의 것.", statKey: "knowledge", xp: 5 },
  { templateId: "t12", type: "choice", emoji: "🔢", title: "수학천재가 될테다", desc: "더하기빼기는 누워서 떡먹기지.", statKey: "knowledge", xp: 5 }
];

// 요구사항 5: 초기 활성 퀘스트는 8개 전부가 아니라 필수1 + 선택2 + 도전1 = 4개만.
export const DEFAULT_ACTIVE_TEMPLATE_IDS = ["t1", "t2", "t4", "t11", "t10", "t12"];

// 능력치 변환기: 부모가 입력한 평범한 문장을 아이 화면용 모험 문구로 변환합니다.
const FLAVOR_BY_STAT = {
  life: { emoji: "🎒", prefix: "혼자서도 잘해요", verb: "마치면 생활력이 강화되요!" },
  knowledge: { emoji: "📖", prefix: "마법 도서관 탐험", verb: "마치면 지식 조각을 얻을 수 있어요" },
  curiosity: { emoji: "🔍", prefix: "탐구 일기 쓰기", verb: "발견하면 탐구력이 차오를 거예요" },
  grit: { emoji: "🔥", prefix: "끈기의 시험", verb: "끝까지 해내면 끈기 조각을 얻어요" },
  courage: { emoji: "⚔️", prefix: "용기의 한 걸음", verb: "해내면 용기 조각이 반짝일 거예요" },
  teamwork: { emoji: "🤝", prefix: "우리 모두의 임무", verb: "도와주면 협동의 별이 떠올라요" },
  heart: { emoji: "💛", prefix: "마음 지도 그리기", verb: "표현하면 마음력이 따뜻해져요" },
};

export function transformToQuestFlavor(text, statKey) {
  const f = FLAVOR_BY_STAT[statKey] || FLAVOR_BY_STAT.life;
  const title = text.trim();
  return { emoji: f.emoji, title, desc: `${f.prefix}: "${title}" — ${f.verb}` };
}

export const XP_MIN = 4;
export const XP_MAX = 12;
