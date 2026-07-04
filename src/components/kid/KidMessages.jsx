function formatMessageDate(isoString) {
  if (!isoString) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return "";
  }
}

export function KidMessages({ messages, onReadMessage }) {
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="screen-scroll fade-slide">
      <div className="section-label mt-0">💌 응원 모음</div>

      {sortedMessages.length === 0 && (
        <div className="sleepy-card message-empty-card">
          <div className="sleepy-emoji" aria-hidden="true">💌</div>
          <div className="sleepy-text">아직 모아둔 응원 메시지가 없어요.<br/>보호자가 따뜻한 말을 보내면 여기에 쌓여요.</div>
        </div>
      )}

      {sortedMessages.map((message) => {
        const unread = !message.readAt;
        return (
          <div className={`cheer-card ${unread ? "unread" : ""}`} key={message.id}>
            <div className="cheer-card-top">
              <div className="cheer-card-icon" aria-hidden="true">{unread ? "✨" : "💛"}</div>
              <div className="cheer-card-meta">
                <div className="cheer-card-label">{unread ? "새 응원" : "응원 메시지"}</div>
                <div className="cheer-card-date">{formatMessageDate(message.createdAt)}</div>
              </div>
            </div>
            <div className="cheer-card-text">{message.text}</div>
            {unread && (
              <button type="button" className="cheer-read-btn" onClick={() => onReadMessage(message.id)}>
                읽었어요
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
