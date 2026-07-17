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

export const GUILDS = {
  adventurer: {
    name: "모험가 길드",
    icon: "⚔️",
    description: "오늘의 의뢰를 해결하며 성장하는 길드",
    letterTitle: "길드 게시판에서 온 편지",
    signature: "길드 마스터",
    homeLine: "오늘도 새로운 의뢰가 도착했어.",
    avatarLabel: "불꽃 모험가",
  },
  forest: {
    name: "숲의 길드",
    icon: "🌳",
    description: "작은 씨앗과 숲을 돌보며 성장하는 길드",
    letterTitle: "숲의 길드에서 온 편지",
    signature: "숲의 정령",
    homeLine: "초록빛 숲 임무가 기다리고 있어.",
    avatarLabel: "새싹 지킴이",
  },
  space: {
    name: "우주 탐험대",
    icon: "🚀",
    description: "별과 행성을 탐사하며 성장하는 길드",
    letterTitle: "우주 관제센터에서 온 편지",
    signature: "우주 관제센터장",
    homeLine: "오늘의 탐사 신호가 도착했어.",
    avatarLabel: "별빛 탐험가",
  },
  magic: {
    name: "마법 길드",
    icon: "🪄",
    description: "주문과 지혜를 배우며 성장하는 길드",
    letterTitle: "마법학교에서 온 편지",
    signature: "마법학교 교장선생님",
    homeLine: "오늘 배울 주문이 준비됐어.",
    avatarLabel: "반짝 마법사",
  },
};

export const GUILD_KEYS = Object.keys(GUILDS);

export const GUILD_THEMES = {
  adventurer: {
    primary: "#5CC8A1",
    primarySoft: "#DDF6EC",
    primaryDeep: "#2F8E72",
    accent: "#FFD166",
    accentSoft: "#FFF1C8",
    pattern: "adventurer",
  },
  forest: {
    primary: "#74C365",
    primarySoft: "#E3F7D8",
    primaryDeep: "#438D38",
    accent: "#B8E986",
    accentSoft: "#F0FBDD",
    pattern: "forest",
  },
  space: {
    primary: "#7DA9FF",
    primarySoft: "#E5EEFF",
    primaryDeep: "#4E73D8",
    accent: "#B8A8FF",
    accentSoft: "#EEE9FF",
    pattern: "space",
  },
  magic: {
    primary: "#D28BFF",
    primarySoft: "#F4E4FF",
    primaryDeep: "#9B5DCC",
    accent: "#FFC6EC",
    accentSoft: "#FFE9F7",
    pattern: "magic",
  },
};

export function normalizeGuildKey(guild) {
  return GUILDS[guild] ? guild : "adventurer";
}

export function getGuildMeta(guild) {
  return GUILDS[normalizeGuildKey(guild)];
}

export function getGuildTheme(guild) {
  return GUILD_THEMES[normalizeGuildKey(guild)];
}

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

export function characterLevelFromTotalXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  let need = 40;
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

export const GUILD_LEVEL_TITLES = {
  adventurer: {
    1: "견습 모험가", 2: "초보 길드원", 3: "첫 의뢰자", 4: "길드 심부름꾼", 5: "작은 발걸음",
    6: "마을 탐험가", 7: "지도를 펼친 자", 8: "숲길 정찰자", 9: "의뢰 해결자", 10: "초급 탐험가",
    11: "용기 있는 길드원", 12: "장비 점검자", 13: "길찾기 연습생", 14: "작은 보물 사냥꾼", 15: "의뢰 수습대장",
    16: "동료를 돕는 자", 17: "캠프 관리자", 18: "탐험 기록자", 19: "길드 신뢰자", 20: "중급 모험가",
    21: "던전 입문자", 22: "보급품 관리자", 23: "의뢰 전략가", 24: "위험 감지자", 25: "숙련 탐험가",
    26: "용감한 정찰대원", 27: "동료의 방패", 28: "보물지도 해석자", 29: "어둠길 돌파자", 30: "상급 모험가",
    31: "길드 작전대원", 32: "의뢰 지휘관", 33: "고대 유적 탐험가", 34: "용의 흔적 추적자", 35: "명예 길드원",
    36: "황금 나침반의 주인", 37: "미궁 돌파자", 38: "전설 지도 수집가", 39: "동료를 이끄는 자", 40: "영웅 모험가",
    41: "길드 영웅 후보", 42: "왕국 탐험대장", 43: "전설의 의뢰 해결자", 44: "고대 보물의 수호자", 45: "마스터 모험가",
    46: "길드의 빛", 47: "용을 깨운 자", 48: "전설의 길잡이", 49: "위대한 모험가", 50: "전설의 길드 마스터",
  },
  forest: {
    1: "작은 씨앗", 2: "잠든 씨앗", 3: "깨어난 씨앗", 4: "흙을 만난 씨앗", 5: "새싹 지킴이",
    6: "어린 새싹", 7: "초록 잎 수호자", 8: "숲길 새싹", 9: "이슬 모으는 자", 10: "어린 나무",
    11: "가지를 뻗는 나무", 12: "햇살 받는 나무", 13: "바람 듣는 나무", 14: "숲속 친구", 15: "숲의 관찰자",
    16: "새들의 친구", 17: "꽃봉오리 지킴이", 18: "풀잎 기록자", 19: "작은 숲 관리자", 20: "숲의 돌봄꾼",
    21: "나무그늘 수호자", 22: "숲길 정비사", 23: "뿌리 깊은 나무", 24: "비밀 숲 탐색자", 25: "푸른 숲 지킴이",
    26: "숲의 약초사", 27: "작은 정령의 친구", 28: "숲의 노래꾼", 29: "깊은 숲 안내자", 30: "큰 나무 수호자",
    31: "숲의 균형자", 32: "계절을 읽는 자", 33: "숲의 기억 보관자", 34: "동물들의 친구", 35: "숲의 현자 후보",
    36: "황금 잎 수호자", 37: "안개숲 안내자", 38: "오래된 나무의 친구", 39: "숲의 약속을 지키는 자", 40: "숲의 수호 기사",
    41: "생명의 정원사", 42: "정령숲 관리자", 43: "숲의 비밀을 아는 자", 44: "생명의 샘 수호자", 45: "거목의 수호자",
    46: "숲의 빛", 47: "잠든 숲을 깨운 자", 48: "생명의 길잡이", 49: "위대한 숲의 현자", 50: "전설의 숲 수호자",
  },
  space: {
    1: "견습 승무원", 2: "우주 훈련생", 3: "첫 탑승자", 4: "별빛 관찰자", 5: "작은 별 탐험가",
    6: "궤도 훈련생", 7: "별자리 기록자", 8: "달빛 통신원", 9: "소행성 조사원", 10: "초급 우주 탐사원",
    11: "달 탐사 대원", 12: "별먼지 수집가", 13: "행성 지도 제작자", 14: "우주 신호 해독자", 15: "초급 파일럿",
    16: "별길 안내자", 17: "운석 분석가", 18: "우주 일지 작성자", 19: "은하 통신병", 20: "중급 우주 탐사원",
    21: "행성 착륙 대원", 22: "우주 기지 관리자", 23: "외계 생태 조사원", 24: "성운 관찰자", 25: "숙련 파일럿",
    26: "혜성 추적자", 27: "우주선 정비사", 28: "은하 항로 탐색자", 29: "블랙홀 관찰자", 30: "상급 우주 탐사원",
    31: "별빛 항해사", 32: "우주 기상 예보관", 33: "고대 위성 조사관", 34: "미지 행성 탐험가", 35: "은하 탐험대장 후보",
    36: "황금 별표식의 주인", 37: "성간 항해자", 38: "별의 문 통과자", 39: "우주 연합 대원", 40: "은하 파일럿",
    41: "은하 구조대원", 42: "별무리 사령관", 43: "우주 균형 관리자", 44: "은하 보물 탐사자", 45: "마스터 파일럿",
    46: "은하의 빛", 47: "잠든 별을 깨운 자", 48: "별들의 길잡이", 49: "위대한 은하 탐험가", 50: "전설의 은하 항해자",
  },
  magic: {
    1: "견습 마법사", 2: "마법 입문자", 3: "첫 주문 연습생", 4: "반짝임 수습생", 5: "초급 주문사",
    6: "마법 노트 작성자", 7: "지팡이 연습생", 8: "작은 불꽃 마법사", 9: "주문 조합가", 10: "초급 마법사",
    11: "마법 도서관 조수", 12: "지혜의 두루마리꾼", 13: "마법진 연습자", 14: "별빛 주문사", 15: "중급 주문 연습생",
    16: "마법 재료 수집가", 17: "비밀 주문 연구원", 18: "마법 일지 작성자", 19: "수정구슬 관찰자", 20: "중급 마법사",
    21: "원소 마법 입문자", 22: "마법 물약 제조자", 23: "고대 문자 해독자", 24: "마법 생물 친구", 25: "숙련 마법사",
    26: "주문 설계자", 27: "보호막 마법사", 28: "기억의 마법사", 29: "그림자 주문 연구자", 30: "상급 마법사",
    31: "달빛 마법사", 32: "계절 주문사", 33: "고대 마법 연구자", 34: "환상 마법사", 35: "현자 후보생",
    36: "황금 지팡이의 주인", 37: "차원문 연습자", 38: "시간 주문 연구자", 39: "마법 의회의 조수", 40: "고위 마법사",
    41: "빛의 주문사", 42: "별의 현자", 43: "금서 보관자", 44: "대도서관 수호자", 45: "마스터 마법사",
    46: "마법의 빛", 47: "잠든 주문을 깨운 자", 48: "지혜의 길잡이", 49: "위대한 마법 현자", 50: "전설의 대마법사",
  },
};

export const GUILD_LETTERS = {
  adventurer: [
    "새로운 의뢰가 길드 게시판에 도착했어. 오늘도 네 도움이 필요해!",
    "길드원들이 너를 기다리고 있어. 오늘의 작은 임무부터 시작해보자.",
    "모험은 멀리 있는 게 아니야. 오늘 해야 할 일을 해내는 것도 멋진 모험이야.",
    "장비를 챙기고 마음을 준비해. 오늘의 퀘스트가 곧 시작돼.",
    "어제보다 조금 더 성장한 모험가가 될 준비가 되었니?",
    "작은 의뢰도 끝까지 해내면 훌륭한 길드원이 될 수 있어.",
    "오늘은 어떤 퀘스트가 너를 기다리고 있을까? 길드 게시판을 확인해보자.",
    "용감한 모험가는 어려운 일도 한 걸음씩 해결한대.",
    "오늘의 의뢰를 완료하면 네 모험 기록에 새로운 이야기가 남을 거야.",
    "길드 마스터가 너에게 특별한 하루를 맡기고 싶대.",
  ],
  forest: [
    "밤사이 숲에 작은 새싹이 고개를 내밀었어. 오늘도 숲을 돌봐줄래?",
    "지혜나무가 새로운 잎을 틔우고 싶어 해. 오늘의 퀘스트를 시작해보자.",
    "숲의 정령들이 너를 기다리고 있어. 작은 행동 하나가 숲을 더 푸르게 만들어.",
    "오늘은 숲길에 햇살이 비치고 있어. 차근차근 하루를 시작해보자.",
    "작은 씨앗도 매일 돌보면 큰 나무가 된대. 오늘의 미션을 확인해봐.",
    "숲속 친구들이 네 도움을 기다리고 있어. 따뜻한 마음으로 시작해보자.",
    "바람이 전해준 소식이 있어. 오늘 숲을 위한 새로운 부탁이 도착했대.",
    "오늘은 지혜의 열매가 열릴지도 몰라. 퀘스트를 하나씩 해내보자.",
    "숲은 조용하지만 매일 조금씩 자라고 있어. 너도 오늘 조금 자랄 수 있어.",
    "초록빛 편지가 도착했어. 오늘의 숲 임무를 확인해보자.",
  ],
  space: [
    "우주 관제센터에서 새로운 신호를 발견했어. 오늘의 탐사를 시작해보자.",
    "별빛 레이더에 오늘의 임무가 잡혔어. 탐험 준비 완료!",
    "작은 행성 하나가 너의 도움을 기다리고 있어. 오늘의 퀘스트를 확인해봐.",
    "우주선 엔진이 켜졌어. 오늘도 한 걸음씩 별을 향해 나아가자.",
    "새로운 별자리가 나타났어. 네가 오늘의 기록을 채워줄 차례야.",
    "관제센터에서 메시지가 도착했어. 오늘의 탐사 임무를 수행해줘.",
    "우주는 넓고, 오늘의 도전은 작게 시작할 수 있어.",
    "행성 탐사 대원이 되려면 매일 작은 임무를 해결해야 해.",
    "오늘의 우주 일지 첫 장을 열 시간이야.",
    "별먼지가 반짝이고 있어. 오늘의 미션을 완료하면 더 밝게 빛날 거야.",
  ],
  magic: [
    "마법학교에서 오늘의 주문이 도착했어. 천천히 하나씩 배워보자.",
    "마법 도서관의 책장이 열렸어. 오늘의 퀘스트를 확인해봐.",
    "작은 주문도 매일 연습하면 멋진 마법이 된대.",
    "오늘은 어떤 마법을 배울 수 있을까? 첫 번째 임무를 시작해보자.",
    "반짝이는 두루마리가 너를 기다리고 있어. 오늘의 과제를 펼쳐봐.",
    "지혜의 수정구슬이 말했어. 오늘도 성장할 기회가 찾아왔대.",
    "마법은 한 번에 완성되지 않아. 작은 퀘스트부터 시작해보자.",
    "교장선생님이 너에게 특별한 주문 연습을 맡겼어.",
    "오늘의 마법 일지에 새로운 기록을 남길 시간이야.",
    "별빛 잉크로 쓰인 편지가 도착했어. 오늘의 주문을 확인해보자.",
  ],
};

function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getLevelTitle(level, guild) {
  const safeLevel = Math.min(Math.max(Number(level) || 1, 1), MAX_LEVEL);
  const safeGuild = normalizeGuildKey(guild);
  return GUILD_LEVEL_TITLES[safeGuild]?.[safeLevel] || GUILD_LEVEL_TITLES.adventurer[safeLevel];
}

export function characterTitle(level, guild = "adventurer") {
  return getLevelTitle(level, guild);
}

export function getDailyGuildLetter(guild, dateString) {
  const safeGuild = normalizeGuildKey(guild);
  const letters = GUILD_LETTERS[safeGuild] || GUILD_LETTERS.adventurer;
  const index = hashString(`${safeGuild}:${dateString}`) % letters.length;
  return {
    id: `${safeGuild}-${dateString}-${index}`,
    text: letters[index],
  };
}

export const QUEST_TYPE_LABEL = {
  required: "필수 퀘스트",
  choice: "선택 퀘스트",
  challenge: "도전 퀘스트",
  bonus: "보너스 퀘스트",
};

export const QUEST_TYPE_SHORT_LABEL = {
  required: "필수",
  choice: "선택",
  challenge: "도전",
  bonus: "보너스",
};

export const REPEAT_DAY_OPTIONS = [
  { key: "daily", label: "매일" },
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

export const WEEKDAY_LABELS = {
  mon: "월요일",
  tue: "화요일",
  wed: "수요일",
  thu: "목요일",
  fri: "금요일",
  sat: "토요일",
  sun: "일요일",
};

export function repeatDaysLabel(repeatDays = ["daily"]) {
  if (!Array.isArray(repeatDays) || repeatDays.length === 0 || repeatDays.includes("daily")) return "매일";
  const labels = REPEAT_DAY_OPTIONS
    .filter((option) => option.key !== "daily" && repeatDays.includes(option.key))
    .map((option) => option.label);
  return labels.length ? labels.join("·") : "매일";
}

// 기본 제공 템플릿 6종. 새로 시작하는 사용자에게 샘플이 되는 세트이므로,
// 분할 보상(rewards)이 있는 템플릿은 defaultXp를 보상 합계와 같게 유지해야 합니다.
export const SYSTEM_QUEST_TEMPLATES = [
  {
    id: "base_wash",
    source: "system",
    title: "반짝반짝 정비 미션",
    description: "세수, 양치, 샤워 등 정해진 씻기 루틴을 스스로 해요.",
    ability: "life",
    defaultXp: 5,
    rewards: [{ statKey: "life", xp: 4 }, { statKey: "heart", xp: 1 }],
    defaultType: "required",
    repeatDays: ["daily"],
    emoji: "🧼",
    isActive: true,
  },
  {
    id: "base_read_15",
    source: "system",
    title: "지식의 문 열기",
    description: "좋아하는 책을 15분 동안 읽어요.",
    ability: "knowledge",
    defaultXp: 6,
    rewards: [{ statKey: "knowledge", xp: 4 }, { statKey: "curiosity", xp: 2 }],
    defaultType: "choice",
    repeatDays: ["daily"],
    emoji: "📖",
    isActive: true,
  },
  {
    id: "base_school_bag",
    source: "system",
    title: "내일의 장비 챙기기",
    description: "알림장, 숙제, 준비물을 확인하고 가방을 스스로 챙겨요.",
    ability: "life",
    defaultXp: 6,
    rewards: [{ statKey: "life", xp: 3 }, { statKey: "curiosity", xp: 3 }],
    defaultType: "required",
    repeatDays: ["daily"],
    emoji: "🎒",
    isActive: true,
  },
  {
    id: "base_meal",
    source: "system",
    title: "에너지 충전 작전",
    description: "정해진 식사량과 다양한 반찬을 먹으려고 노력해요.",
    ability: "grit",
    defaultXp: 5,
    rewards: [{ statKey: "grit", xp: 3 }, { statKey: "courage", xp: 2 }],
    defaultType: "required",
    repeatDays: ["daily"],
    emoji: "🥣",
    isActive: true,
  },
  {
    id: "base_room_clean",
    source: "system",
    title: "나만의 기지 정비",
    description: "책상, 장난감, 가방 주변 중 하나를 스스로 정리해요.",
    ability: "life",
    defaultXp: 5,
    defaultType: "choice",
    repeatDays: ["daily"],
    emoji: "🧺",
    isActive: true,
  },
  {
    id: "base_thank_you",
    source: "system",
    title: "마음빛 발견하기",
    description: "오늘 함께했던 사람과 좋았던 일을 말해봐요.",
    ability: "heart",
    defaultXp: 8,
    rewards: [{ statKey: "heart", xp: 5 }, { statKey: "teamwork", xp: 3 }],
    defaultType: "choice",
    repeatDays: ["daily"],
    emoji: "💛",
    isActive: true,
  },
];

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
  { templateId: "t11", type: "choice", emoji: "📖", title: "영어가 술술", desc: "이번 링키 Top10은 나의 것.", statKey: "knowledge", xp: 2, rewards: [{ statKey: "knowledge", xp: 2 }, { statKey: "grit", xp: 2 }] },
  { templateId: "t12", type: "choice", emoji: "🔢", title: "수학천재가 될테다", desc: "더하기빼기는 누워서 떡먹기지.", statKey: "knowledge", xp: 2, rewards: [{ statKey: "knowledge", xp: 2 }, { statKey: "grit", xp: 2 }] },
  { templateId: "t13", type: "required", emoji: "🫧", title: "깨끗히 세수하기", desc: "얼굴을 물로 꼼꼼히 씻고 상쾌하게 시작해요.", statKey: "life", xp: 3 },
  { templateId: "t14", type: "bonus", emoji: "🍽️", title: "다 먹은 그릇 정리 도와주기", desc: "식사가 끝난 뒤 내 그릇을 정리하며 가족을 도와요.", statKey: "teamwork", xp: 5 },
  { templateId: "t15", type: "choice", emoji: "💛", title: "오늘 마음 이야기하기", desc: "오늘 좋았던 일이나 속상했던 일을 부모님에게 말해요.", statKey: "heart", xp: 5 },
  { templateId: "t16", type: "challenge", emoji: "🔍", title: "새로운 발견 기록하기", desc: "오늘 새롭게 발견한 것을 글로 적어봐요.", statKey: "curiosity", xp: 10 }
];

export function getQuestRewards(quest) {
  if (Array.isArray(quest.rewards) && quest.rewards.length > 0) {
    return quest.rewards;
  }
  return [{ statKey: quest.statKey, xp: quest.xp }];
}

export function questTotalXp(quest) {
  return getQuestRewards(quest).reduce((sum, r) => sum + r.xp, 0);
}

export const DEFAULT_ACTIVE_TEMPLATE_IDS = ["t1", "t2", "t4", "t11", "t10", "t12"];

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
