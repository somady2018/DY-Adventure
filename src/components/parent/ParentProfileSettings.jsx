import { useState } from "react";
import { GUILDS, GUILD_KEYS, getGuildMeta } from "../../data/definitions";

export function ParentProfileSettings({ profile, onSaveProfile, showToast }) {
  const current = profile || { childName: "도영", guild: "adventurer" };
  const [childName, setChildName] = useState(current.childName);
  const [guild, setGuild] = useState(current.guild);
  const currentGuild = getGuildMeta(current.guild);

  function handleSubmit(e) {
    e.preventDefault();
    onSaveProfile({ childName, guild });
    showToast("아이 설정을 저장했어요", "success");
  }

  return (
    <form className="parent-card" onSubmit={handleSubmit}>
      <div className="parent-card-title">아이 설정</div>
      <div className="parent-card-sub" style={{ marginBottom: 12 }}>
        현재 길드: {currentGuild.name} · 아이 이름: {current.childName}
      </div>

      <label className="field-label" htmlFor="profileChildName">아이 이름</label>
      <input
        id="profileChildName"
        className="text-input"
        value={childName}
        onChange={(e) => setChildName(e.target.value)}
        placeholder="아이 이름"
        autoComplete="off"
      />

      <div className="field-label">길드 종류</div>
      <div className="guild-select-list">
        {GUILD_KEYS.map((key) => {
          const meta = GUILDS[key];
          const selected = guild === key;
          return (
            <button
              type="button"
              key={key}
              className={`guild-select-row ${selected ? "selected" : ""}`}
              onClick={() => setGuild(key)}
              aria-pressed={selected}
            >
              <span className="guild-select-icon" aria-hidden="true">{meta.icon}</span>
              <span>
                <span className="guild-select-name">{meta.name}</span>
                <span className="guild-select-desc">{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button type="submit" className="modal-btn dark">설정 저장</button>
    </form>
  );
}
