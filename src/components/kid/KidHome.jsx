import { STAT_LIST, levelFromXp, characterLevelFromTotalXp, characterTitle } from "../../data/definitions";
import { QuestCard } from "../shared/Shared";
import { formatDateKorean } from "../../storage/dateUtils";

function availableXp(quests) {
  return quests
    .filter((q) => q.status !== "approved")
    .reduce((sum, q) => sum + q.xp, 0);
}

export function KidHome({ quests, statXp, totalXp, todayDate, onOpenQuest, messages, onReadMessage }) {
  const required = quests.filter((q) => q.type === "required");
  const choice = quests.filter((q) => q.type === "choice");
  const challengeAndBonus = quests.filter((q) => q.type === "challenge" || q.type === "bonus");

  const allApproved = quests.length > 0 && quests.every((q) => q.status === "approved");
  const allPending = quests.length > 0 && quests.every((q) => q.status === "pending" || q.status === "approved") &&
    quests.some((q) => q.status === "pending") && !quests.some((q) => q.status === "open" || q.status === "retry");

  const { level: charLevel } = characterLevelFromTotalXp(totalXp);
  const title = characterTitle(charLevel);
  const approvedCount = quests.filter((q) => q.status === "approved").length;

  const unreadMessage = messages.find((m) => !m.readAt);

  return (
    <div className="screen-scroll fade-slide">
      {unreadMessage && (
        <div className="message-banner">
          <span aria-hidden="true">💌</span>
          <div className="message-banner-text">{unreadMessage.text}</div>
          <button type="button" onClick={() => onReadMessage(unreadMessage.id)} aria-label="메시지 확인">확인</button>
        </div>
      )}

      <div className="char-banner">
        <div className="char-avatar" aria-hidden="true">🧭</div>
        <div className="char-meta">
          <div className="char-name">불꽃 탐험가 도영</div>
          <div className="char-title">Lv.{charLevel} · {title}</div>
          <div className="char-bar-track">
            <div
              className="char-bar-fill"
              style={{ width: quests.length ? `${Math.round((approvedCount / quests.length) * 100)}%` : "0%" }}
            />
          </div>
          <div className="char-bar-label">{formatDateKorean(todayDate)} · 오늘의 모험 {approvedCount} / {quests.length} 완료</div>
        </div>
      </div>

      <div className="stat-strip">
        {STAT_LIST.map((s) => {
          const { level } = levelFromXp(statXp[s.key] || 0);
          return (
            <div className="stat-pill" key={s.key}>
              <div className="stat-ico" aria-hidden="true">{s.emoji}</div>
              <div className="stat-lv">Lv.{level}</div>
              <div className="stat-name">{s.name}</div>
            </div>
          );
        })}
      </div>

      {quests.length === 0 && (
        <div className="sleepy-card">
          <div className="sleepy-emoji" aria-hidden="true">🗺️</div>
          <div className="sleepy-text">오늘은 아직 등록된 모험이 없어요.<br/>보호자에게 새 퀘스트를 부탁해보세요.</div>
        </div>
      )}

      {allApproved && (
        <div className="sleepy-card success fade-slide">
          <div className="sleepy-emoji" aria-hidden="true">🌟</div>
          <div className="sleepy-text">오늘의 모험을 모두 마쳤어요!</div>
        </div>
      )}
      {!allApproved && allPending && (
        <div className="sleepy-card waiting fade-slide">
          <div className="sleepy-emoji" aria-hidden="true">⏳</div>
          <div className="sleepy-text">모든 퀘스트를 보호자에게 보냈어요.</div>
        </div>
      )}

      {required.length > 0 && (
        <>
          <div className="section-label">🎒 필수 퀘스트 <span className="count-badge">{required.filter((q) => q.status === "open").length}</span><span className="xp-badge">+{availableXp(required)} XP</span></div>
          {required.map((q) => <QuestCard key={q.id} quest={q} onOpen={onOpenQuest} />)}
        </>
      )}

      {choice.length > 0 && (
        <>
          <div className="section-label">🌿 선택 퀘스트 <span className="count-badge">{choice.filter((q) => q.status === "open").length}</span><span className="xp-badge">+{availableXp(choice)} XP</span></div>
          {choice.map((q) => <QuestCard key={q.id} quest={q} onOpen={onOpenQuest} />)}
        </>
      )}

      {challengeAndBonus.length > 0 && (
        <>
          <div className="section-label">✨ 도전 & 보너스 퀘스트 <span className="count-badge">{challengeAndBonus.filter((q) => q.status === "open").length}</span><span className="xp-badge">+{availableXp(challengeAndBonus)} XP</span></div>
          {challengeAndBonus.map((q) => <QuestCard key={q.id} quest={q} onOpen={onOpenQuest} />)}
        </>
      )}
    </div>
  );
}
