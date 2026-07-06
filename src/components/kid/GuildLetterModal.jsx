import { getGuildMeta } from "../../data/definitions";

export function GuildLetterModal({ profile, letter, onClose }) {
  if (!profile || !letter) return null;
  const guild = getGuildMeta(profile.guild);

  return (
    <div className="overlay guild-letter-overlay" role="dialog" aria-modal="true">
      <div className="modal-card guild-letter-card">
        <div className="guild-letter-title">
          <span aria-hidden="true">{guild.icon}</span>
          <span>{guild.letterTitle}</span>
        </div>
        <div className="guild-letter-greeting">안녕, {profile.childName}!</div>
        <p className="guild-letter-body">{letter.text}</p>
        <div className="guild-letter-signature">- {guild.signature}</div>
        <button type="button" className="modal-btn" onClick={onClose}>오늘의 퀘스트 확인하기</button>
      </div>
    </div>
  );
}
