import { STATS } from "../../data/definitions";

// 아이가 퀘스트 카드를 눌렀을 때 뜨는 상세 확인창.
// 여기서 "완료했어요"를 눌러야 비로소 pending으로 바뀌고, 이때도 보상은 주지 않습니다. (요구사항 4)
export function QuestDetailModal({ quest, onSubmit, onRestart, onClose }) {
  if (!quest) return null;
  const stat = STATS[quest.statKey];

  if (quest.status === "pending") {
    return (
      <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-quest-emoji-row">
            <div className="quest-emoji" aria-hidden="true">{quest.emoji}</div>
            <div>
              <div className="modal-headline" style={{ marginBottom: 2 }}>{quest.title}</div>
              <div className="modal-sub" style={{ marginBottom: 0 }}>보호자가 확인하는 중이에요</div>
            </div>
          </div>
          <div className="modal-sub">
            보호자가 확인하면 {stat.name} 경험치를 받을 수 있어요. 조금만 기다려주세요!
          </div>
          <button type="button" className="modal-btn dark" onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  if (quest.status === "retry") {
    return (
      <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-quest-emoji-row">
            <div className="quest-emoji" aria-hidden="true">{quest.emoji}</div>
            <div>
              <div className="modal-headline" style={{ marginBottom: 2 }}>{quest.title}</div>
              <div className="modal-sub" style={{ marginBottom: 0 }}>한 번 더 도전해봐요</div>
            </div>
          </div>
          {quest.retryReason && (
            <div className="retry-banner" style={{ marginBottom: 14, textAlign: "left" }}>
              보호자 메모: {quest.retryReason}
            </div>
          )}
          <button type="button" className="modal-btn" onClick={() => onRestart(quest.id)}>다시 시작하기</button>
          <button type="button" className="modal-btn ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  if (quest.status === "approved") {
    return (
      <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-quest-emoji-row">
            <div className="quest-emoji" aria-hidden="true">{quest.emoji}</div>
            <div>
              <div className="modal-headline" style={{ marginBottom: 2 }}>{quest.title}</div>
              <div className="modal-sub" style={{ marginBottom: 0 }}>이미 완료한 퀘스트예요</div>
            </div>
          </div>
          <button type="button" className="modal-btn dark" onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  // status === "open"
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-quest-emoji-row">
          <div className="quest-emoji" aria-hidden="true">{quest.emoji}</div>
          <div>
            <div className="modal-headline" style={{ marginBottom: 2 }}>{quest.title}</div>
          </div>
        </div>
        <div className="modal-sub" style={{ textAlign: "left" }}>{quest.desc}</div>
        <div className="modal-stat-gain">{stat.emoji} {stat.name} +{quest.xp} (보호자 확인 후 지급)</div>
        <button type="button" className="modal-btn" onClick={() => onSubmit(quest.id)}>
          완료했어요
        </button>
        <button type="button" className="modal-btn ghost" onClick={onClose}>아직이에요</button>
      </div>
    </div>
  );
}

// 보호자 승인 후, 아이가 앱으로 돌아왔을 때 1회만 보여주는 보상 연출.
export function CelebrationModal({ quest, onClose }) {
  if (!quest) return null;
  const stat = STATS[quest.statKey];
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card reward" onClick={(e) => e.stopPropagation()}>
        <div className="stamp-circle" aria-hidden="true">{stat.emoji}</div>
        <div className="modal-headline">{quest.title} 완료!</div>
        <div className="modal-stat-gain">{stat.name} 경험치 +{quest.xp}</div>
        <div className="modal-sub">보호자가 확인했어요. 다음 모험으로 가볼까요?</div>
        <button type="button" className="modal-btn" onClick={onClose}>모험 계속하기</button>
      </div>
    </div>
  );
}
