import { useState } from "react";
import { GUILDS, GUILD_KEYS, getGuildTheme } from "../../data/definitions";

export function Onboarding({ onComplete }) {
  const [childName, setChildName] = useState("");
  const [guild, setGuild] = useState("adventurer");
  const canStart = childName.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canStart) return;
    onComplete({ childName, guild });
  }

  return (
    <div className="screen onboarding-screen">
      <form className="onboarding-panel fade-slide" onSubmit={handleSubmit}>
        <div className="onboarding-kicker">Todo Adventure</div>
        <h1 className="onboarding-title">어느 길드에 가입할까요?</h1>
        <p className="onboarding-sub">길드를 선택하면 매일 다른 분위기의 편지와 레벨명이 적용돼요.</p>

        <label className="field-label" htmlFor="childName">아이 이름</label>
        <input
          id="childName"
          className="text-input"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="아이 이름을 입력하세요"
          autoComplete="off"
        />

        <div className="guild-grid">
          {GUILD_KEYS.map((key) => {
            const meta = GUILDS[key];
            const theme = getGuildTheme(key);
            const selected = guild === key;
            return (
              <button
                type="button"
                key={key}
                className={`guild-card ${selected ? "selected" : ""}`}
                style={{
                  "--guild-card-primary": theme.primary,
                  "--guild-card-soft": theme.primarySoft,
                  "--guild-card-accent": theme.accent,
                }}
                onClick={() => setGuild(key)}
                aria-pressed={selected}
              >
                <span className="guild-card-icon" aria-hidden="true">{meta.icon}</span>
                <span className="guild-card-name">{meta.name}</span>
                <span className="guild-card-desc">{meta.description}</span>
              </button>
            );
          })}
        </div>

        <button type="submit" className="modal-btn" disabled={!canStart}>시작하기</button>
      </form>
    </div>
  );
}
