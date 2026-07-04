import { STATS, QUEST_TYPE_LABEL } from "../../data/definitions";

export function QuestTagLabel({ type }) {
  return <span className={`quest-tag ${type}`}>{QUEST_TYPE_LABEL[type] || type}</span>;
}

// 아이 화면용 퀘스트 카드. 상태(open/pending/approved/retry)에 따라 다르게 표시합니다.
// 요구사항 7: pending은 체크 표시 대신 "확인 대기 중" 문구로 표시.
export function QuestCard({ quest, onOpen }) {
  const stat = STATS[quest.statKey];
  const isOpen = quest.status === "open";
  const statusText =
    quest.status === "pending" ? "확인 대기 중" :
    quest.status === "approved" ? "완료" :
    quest.status === "retry" ? "다시 도전해요" : "";

  return (
    <button
      type="button"
      className={`quest-card ${quest.type} ${isOpen ? "clickable" : "dim"}`}
      onClick={() => onOpen(quest)}
      aria-label={`${quest.title} 퀘스트, 상태: ${statusText || "진행 전"}`}
    >
      <QuestTagLabel type={quest.type} />
      <div className="quest-emoji" aria-hidden="true">{quest.emoji}</div>
      <div className="quest-info">
        <div className="quest-title">{quest.title}</div>
        <div className="quest-desc">{quest.desc}</div>
        {isOpen && (
          <div className="quest-reward">{stat.emoji} {stat.name} +{quest.xp}</div>
        )}
        {!isOpen && (
          <div className={`quest-status-label ${quest.status}`}>{statusText}</div>
        )}
        {quest.status === "retry" && quest.retryReason && (
          <div className="retry-banner">보호자 메모: {quest.retryReason}</div>
        )}
      </div>
      <div className={`quest-check ${quest.status !== "open" ? quest.status : ""}`} aria-hidden="true">
        {quest.status === "pending" ? "⏳" : quest.status === "approved" ? "✓" : quest.status === "retry" ? "↺" : ""}
      </div>
    </button>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.tone === "error" ? "error" : ""}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

// 2단계 확인이 필요한 위험 동작(전체 초기화)을 위한 범용 확인 다이얼로그.
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-headline">{title}</div>
        <div className="modal-sub">{message}</div>
        <button type="button" className={`modal-btn ${danger ? "danger" : "dark"}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="modal-btn ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}
