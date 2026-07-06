import { useState } from "react";
import { STATS, getQuestRewards } from "../../data/definitions";

function rewardSummary(quest) {
  return getQuestRewards(quest)
    .map((r) => `${STATS[r.statKey].name} +${r.xp}`)
    .join(" · ");
}

export function ParentToday({ quests, profile, onApprove, onRequestRetry }) {
  const [approvingId, setApprovingId] = useState(null);
  const [retryTargetId, setRetryTargetId] = useState(null);
  const [retryReason, setRetryReason] = useState("");

  const pending = quests.filter((q) => q.status === "pending");
  const approved = quests.filter((q) => q.status === "approved");
  const others = quests.filter((q) => q.status === "open" || q.status === "retry");

  function handleApprove(questId) {
    if (approvingId) return;
    setApprovingId(questId);
    onApprove(questId);
    setTimeout(() => setApprovingId(null), 600);
  }

  function openRetryPrompt(questId) {
    setRetryTargetId(questId);
    setRetryReason("");
  }

  function submitRetry() {
    onRequestRetry(retryTargetId, retryReason.trim() || "다시 한 번 해볼까요?");
    setRetryTargetId(null);
    setRetryReason("");
  }

  return (
    <div className="fade-slide">
      <div className="metric-grid" style={{ marginTop: 4 }}>
        <div className="metric-box">
          <div className="metric-num">{approved.length}/{quests.length}</div>
          <div className="metric-label">오늘 완료한 퀘스트</div>
        </div>
        <div className="metric-box">
          <div className="metric-num">{pending.length}</div>
          <div className="metric-label">확인 기다리는 중</div>
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">⏳ 확인 대기</div>
        <div className="parent-card-sub">{profile.childName}이가 완료를 알려온 퀘스트예요. 확인하고 승인해주세요.</div>
        <div style={{ marginTop: 4 }}>
          {pending.length === 0 && <div className="empty-row">아직 확인 대기 중인 퀘스트가 없어요</div>}
          {pending.map((q) => (
            <div className="pending-row" key={q.id}>
              <div className="pending-emoji" aria-hidden="true">{q.emoji}</div>
              <div className="pending-info">
                <div className="pending-title">{q.title}</div>
                <div className="pending-meta">{rewardSummary(q)} 예정</div>
              </div>
              <div className="pending-actions">
                <button type="button" className="pbtn reject" onClick={() => openRetryPrompt(q.id)} aria-label={`${q.title} 재도전 요청`}>↺</button>
                <button
                  type="button"
                  className="pbtn approve"
                  onClick={() => handleApprove(q.id)}
                  disabled={approvingId === q.id}
                  aria-label={`${q.title} 승인`}
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">✅ 오늘 완료</div>
        <div style={{ marginTop: 4 }}>
          {approved.length === 0 && <div className="empty-row">아직 완료된 퀘스트가 없어요</div>}
          {approved.map((q) => (
            <div className="pending-row" key={q.id}>
              <div className="pending-emoji" aria-hidden="true">{q.emoji}</div>
              <div className="pending-info">
                <div className="pending-title">{q.title}</div>
                <div className="pending-meta">{rewardSummary(q)} 승인됨</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {others.length > 0 && (
        <div className="parent-card">
          <div className="parent-card-title">📋 진행 전 / 재도전</div>
          <div style={{ marginTop: 4 }}>
            {others.map((q) => (
              <div className="pending-row" key={q.id}>
                <div className="pending-emoji" aria-hidden="true">{q.emoji}</div>
                <div className="pending-info">
                  <div className="pending-title">{q.title}</div>
                  <div className="pending-meta">
                    {q.status === "retry" ? `재도전 대기 · ${q.retryReason || ""}` : `${rewardSummary(q)} 퀘스트`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {retryTargetId && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-headline">재도전을 요청할까요?</div>
            <div className="modal-sub">{profile.childName}이의 퀘스트 화면에 보일 짧은 이유를 남겨주세요.</div>
            <textarea
              className="textarea-input"
              style={{ marginBottom: 14 }}
              placeholder="예: 가방을 다시 한 번 확인해볼까?"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
              aria-label="재도전 이유"
            />
            <button type="button" className="modal-btn dark" onClick={submitRetry}>재도전 요청 보내기</button>
            <button type="button" className="modal-btn ghost" onClick={() => setRetryTargetId(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
