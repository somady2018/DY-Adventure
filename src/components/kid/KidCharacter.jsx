import { STAT_LIST, levelFromXp, characterLevelFromTotalXp, characterTitle } from "../../data/definitions";

export function KidCharacter({ statXp, totalXp }) {
  const { level: charLevel } = characterLevelFromTotalXp(totalXp);

  return (
    <div className="screen-scroll fade-slide">
      <div className="char-banner" style={{ marginTop: 4 }}>
        <div className="char-avatar" style={{ fontSize: 34 }} aria-hidden="true">🧭</div>
        <div className="char-meta">
          <div className="char-name">불꽃 탐험가 도영</div>
          <div className="char-title">Lv.{charLevel} · {characterTitle(charLevel)}</div>
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
              <div className="char-bar-fill" style={{ width: `${pct}%`, background: s.color }} />
            </div>
            <div className="char-bar-label">다음 레벨까지 {need - into} 포인트</div>
          </div>
        );
      })}
    </div>
  );
}
