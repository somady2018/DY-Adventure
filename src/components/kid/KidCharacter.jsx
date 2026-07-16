import { STAT_LIST, characterLevelFromTotalXp, characterTitle, getGuildMeta, levelFromXp } from "../../data/definitions";

export function KidCharacter({ statXp, totalXp, profile }) {
  const { level: charLevel } = characterLevelFromTotalXp(totalXp);
  const guild = getGuildMeta(profile?.guild);

  return (
    <div className="screen-scroll fade-slide">
      <div className="char-banner" style={{ marginTop: 4 }}>
        <div className="char-avatar" style={{ fontSize: 34 }} aria-hidden="true">{guild.icon}</div>
        <div className="char-meta">
          <div className="char-name">{guild.avatarLabel} {profile.childName}</div>
          <div className="char-title">Lv.{charLevel} · {characterTitle(charLevel, profile.guild)}</div>
        </div>
      </div>

      <div className="section-label">📊 나의 능력치</div>
      {STAT_LIST.map((s) => {
        const { level, into, need } = levelFromXp(statXp[s.key] || 0);
        const pct = Math.round((into / need) * 100);
        return (
          <div className="stat-big-card" key={s.key}>
            <div className="stat-big-top">
              <div className="stat-big-ico" style={{ background: s.light }} aria-hidden="true">{s.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="stat-big-name">{s.name}</div>
                <div className="stat-big-lv">Lv.{level} · {s.desc}</div>
              </div>
            </div>
            <div className="char-bar-track">
              <div className="char-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="char-bar-label">다음 레벨까지 {need - into} 포인트</div>
          </div>
        );
      })}
    </div>
  );
}
