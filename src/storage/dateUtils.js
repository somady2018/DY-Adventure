// Asia/Seoul 기준 날짜 계산 유틸리티.
// 기기 자체의 시간대 설정과 무관하게 "오늘"을 한국 시간 기준으로 고정합니다.

const SEOUL_TZ = "Asia/Seoul";

// YYYY-MM-DD 형식의 Asia/Seoul 기준 날짜 문자열을 반환합니다.
export function todaySeoulDateString(baseDate = new Date()) {
  return formatSeoulDateString(baseDate);
}

export function formatSeoulDateString(date) {
  // Intl.DateTimeFormat으로 타임존 변환 후 YYYY-MM-DD로 조립합니다.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}

export function addDaysToDateString(dateString, days) {
  // dateString은 'YYYY-MM-DD'. 시간대 영향을 받지 않도록 UTC 정오로 고정해서 계산합니다.
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function tomorrowSeoulDateString(baseDate = new Date()) {
  return addDaysToDateString(todaySeoulDateString(baseDate), 1);
}

export function weekdayCodeForDateString(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dt.getUTCDay()];
}

export function koreanWeekdayForDateString(dateString) {
  const labels = {
    mon: "월요일",
    tue: "화요일",
    wed: "수요일",
    thu: "목요일",
    fri: "금요일",
    sat: "토요일",
    sun: "일요일",
  };
  return labels[weekdayCodeForDateString(dateString)];
}

export function isWithinLastNDays(dateString, n, baseDate = new Date()) {
  const today = todaySeoulDateString(baseDate);
  const cutoff = addDaysToDateString(today, -(n - 1));
  return dateString >= cutoff && dateString <= today;
}

export function formatDateKorean(dateString) {
  const [, m, d] = dateString.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function nowIso() {
  return new Date().toISOString();
}
