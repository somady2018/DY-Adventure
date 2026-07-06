import { SKILLS, STATS, levelFromXp } from "../../data/definitions";
import { particle } from "../../utils/korean";

export function KidSkillTree({ statXp, profile }) {
  return (
    <div className="screen-scroll fade-slide">
      <div className="section-label mt-0">🗺️ 스킬 트리</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14, lineHeight: 1.6 }}>
        능력치 레벨이 오르면 새로운 스킬을 얻어요. 스킬은 {profile.childName}{particle(profile.childName, "이", "가")} 어떤 사람으로 자라고 있는지 보여주는 기록이에요.
      </div>
      {SKILLS.map((sk) => {
        const stat = STATS[sk.statKey];
        const { level } = levelFromXp(statXp[sk.statKey] || 0);
        const unlocked = level >= sk.levelReq;
        return (
          <div className={`skill-node ${unlocked ? "" : "locked"}`} key={sk.id}>
            <div className="skill-node-ico" aria-hidden="true">{unlocked ? sk.emoji : "🔒"}</div>
            <div style={{ flex: 1 }}>
              <div className="skill-node-name">{sk.name}</div>
              <div className="skill-node-desc">{unlocked ? sk.desc : `${stat.name} Lv.${sk.levelReq}에 잠금 해제`}</div>
            </div>
            {!unlocked && <div className="skill-lock-badge">Lv.{level}/{sk.levelReq}</div>}
          </div>
        );
      })}
    </div>
  );
}
