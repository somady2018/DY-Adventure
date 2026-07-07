import { QUEST_TYPE_LABEL, STAT_LIST } from "../../data/definitions";

const SETS = [
  { key: "dailyRequiredTemplateIds", title: "기본 필수 퀘스트", type: "required", desc: "매일 꼭 해야 할 일을 담아두세요." },
  { key: "dailyChoiceTemplateIds", title: "기본 선택 퀘스트", type: "choice", desc: "아이에게 선택지로 줄 수 있는 일을 담아두세요." },
  { key: "dailyChallengeTemplateIds", title: "기본 도전 퀘스트", type: "challenge", desc: "조금 더 어려운 성장 미션을 담아두세요." },
];

function statLabel(ability) {
  const stat = STAT_LIST.find((item) => item.key === ability) || STAT_LIST[0];
  return `${stat.emoji} ${stat.name}`;
}

export function ParentQuestSets({ questTemplates, questSets, onSetMembership, showToast }) {
  const activeTemplates = questTemplates.filter((template) => template.isActive !== false);

  function toggle(setKey, templateId, included) {
    onSetMembership(setKey, templateId, !included);
    showToast(!included ? "기본 세트에 추가했어요" : "기본 세트에서 뺐어요", "success");
  }

  return (
    <div className="fade-slide">
      {SETS.map((set) => {
        const selectedIds = questSets[set.key] || [];
        return (
          <div className="parent-card" key={set.key}>
            <div className="parent-card-title">{set.title}</div>
            <div className="parent-card-sub" style={{ marginBottom: 10 }}>
              {set.desc} 현재 {selectedIds.length}개가 들어 있어요.
            </div>
            {activeTemplates.map((template) => {
              const included = selectedIds.includes(template.id);
              return (
                <div className="quest-builder-row" key={template.id}>
                  <button
                    type="button"
                    className={`qb-checkbox ${included ? "on" : ""}`}
                    onClick={() => toggle(set.key, template.id, included)}
                    aria-pressed={included}
                    aria-label={`${template.title} ${set.title} ${included ? "제거" : "추가"}`}
                  >
                    {included ? "✓" : ""}
                  </button>
                  <div className="qb-label">
                    {template.emoji} {template.title}
                    <div className="pending-meta">{template.source === "system" ? "기본" : "직접 만든"} · {QUEST_TYPE_LABEL[template.defaultType]} · {statLabel(template.ability)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
