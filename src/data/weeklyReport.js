import { STATS } from "./definitions";
import { isWithinLastNDays } from "../storage/dateUtils";

// 최근 7일간 approved된 퀘스트만 집계합니다. (누적 전체가 아님 — 요구사항 9)
export function computeWeeklyReport(assignedQuests, baseDate = new Date()) {
  const recentApproved = assignedQuests.filter(
    (q) => q.status === "approved" && isWithinLastNDays(q.date, 7, baseDate)
  );
  const recentRetryCount = assignedQuests.filter(
    (q) => q.status === "retry" && isWithinLastNDays(q.date, 7, baseDate)
  ).length;

  const xpByStat = {};
  Object.keys(STATS).forEach((k) => { xpByStat[k] = 0; });
  recentApproved.forEach((q) => {
    xpByStat[q.statKey] = (xpByStat[q.statKey] || 0) + q.xp;
  });

  const topStatEntry = Object.entries(xpByStat).sort((a, b) => b[1] - a[1])[0];
  const topStatKey = topStatEntry && topStatEntry[1] > 0 ? topStatEntry[0] : null;

  const secondStatEntry = Object.entries(xpByStat)
    .filter(([key]) => key !== topStatKey)
    .sort((a, b) => b[1] - a[1])[0];
  const secondStatKey = secondStatEntry && secondStatEntry[1] > 0 ? secondStatEntry[0] : null;

  return {
    completedCount: recentApproved.length,
    retryCount: recentRetryCount,
    xpByStat,
    topStatKey,
    secondStatKey,
  };
}

// 데이터 기반 서술형 문장 생성. 기록이 없으면 성장했다고 단정하지 않습니다. (요구사항 9)
export function generateWeeklyStory(report) {
  const { completedCount, topStatKey, secondStatKey, retryCount } = report;

  if (completedCount === 0) {
    return "최근 7일 동안 보호자가 승인한 퀘스트가 아직 없어요. 퀘스트를 등록하고 완료를 승인하면, 이곳에 도영이의 한 주 이야기가 채워집니다.";
  }

  const topName = topStatKey ? STATS[topStatKey].name : null;
  const secondName = secondStatKey ? STATS[secondStatKey].name : null;

  let story = `최근 7일 동안 도영이는 퀘스트를 ${completedCount}개 완료했어요.`;

  if (topName) {
    story += ` 그중에서도 ${topName} 영역에서 가장 많이 성장했어요.`;
  }
  if (secondName) {
    story += ` ${secondName} 영역도 함께 자라났습니다.`;
  }
  if (retryCount > 0) {
    story += ` 다시 도전한 퀘스트도 ${retryCount}번 있었어요 — 포기하지 않고 다시 시도한 기록이에요.`;
  }

  return story;
}
