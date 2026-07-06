import { useState } from "react";
import { STAT_LIST } from "../../data/definitions";
import { computeWeeklyReport, generateWeeklyStory } from "../../data/weeklyReport";

export function ParentReport({ assignedQuests, profile, onSendMessage, showToast }) {
  const [messageText, setMessageText] = useState("");
  const report = computeWeeklyReport(assignedQuests);
  const story = generateWeeklyStory(report, profile.childName);

  const maxXp = Math.max(1, ...Object.values(report.xpByStat));

  function handleSend() {
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim());
    showToast("응원 메시지를 보냈어요", "success");
    setMessageText("");
  }

  return (
    <div className="fade-slide">
      <div className="weekly-story-box" style={{ marginTop: 4 }}>
        <div className="weekly-story-label">최근 7일 {profile.childName}이의 이야기</div>
        <div className="weekly-story-text">{story}</div>
      </div>

      <div className="metric-grid">
        <div className="metric-box">
          <div className="metric-num">{report.completedCount}</div>
          <div className="metric-label">최근 7일 완료한 퀘스트</div>
        </div>
        <div className="metric-box">
          <div className="metric-num">{report.retryCount}</div>
          <div className="metric-label">재도전 횟수</div>
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">📈 능력치별 획득 XP (최근 7일)</div>
        <div style={{ marginTop: 8 }}>
          {STAT_LIST.map((s) => {
            const xp = report.xpByStat[s.key] || 0;
            const pct = Math.round((xp / maxXp) * 100);
            return (
              <div key={s.key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#233140" }}>{s.emoji} {s.name}</span>
                  <span style={{ fontSize: 11.5, color: "#8A95A1" }}>+{xp} XP</span>
                </div>
                <div className="char-bar-track">
                  <div className="char-bar-fill" style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">💬 칭찬 메시지 보내기</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>{profile.childName}이의 모험 일기에 짧은 응원을 남겨보세요.</div>
        <textarea
          className="textarea-input"
          placeholder="이번 주 정말 잘했어! 특히 감자 관찰 기록이 멋지더라."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          aria-label="칭찬 메시지 입력"
        />
        <button type="button" className="modal-btn dark" style={{ marginTop: 10 }} disabled={!messageText.trim()} onClick={handleSend}>
          응원 보내기
        </button>
      </div>
    </div>
  );
}
