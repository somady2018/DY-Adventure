import { useState } from "react";
import {
  QUEST_TYPE_LABEL,
  REPEAT_DAY_OPTIONS,
  STATS,
  STAT_LIST,
  XP_MAX,
  XP_MIN,
  repeatDaysLabel,
} from "../../data/definitions";

const EMPTY_TEMPLATE = {
  id: null,
  title: "",
  description: "",
  ability: "life",
  defaultXp: 6,
  defaultType: "choice",
  repeatDays: ["daily"],
  isActive: true,
  secondaryAbility: null,
  secondaryXp: 2,
};

function clampXp(value) {
  return Math.min(XP_MAX, Math.max(XP_MIN, Number(value) || XP_MIN));
}

// 보조 보상이 있으면 XP를 잘게 나눌 수 있도록 개별 보상은 1~12 범위를 허용
function clampSplitXp(value) {
  return Math.min(XP_MAX, Math.max(1, Number(value) || 1));
}

function splitRewardsOf(template) {
  return Array.isArray(template.rewards) && template.rewards.length >= 2 ? template.rewards : null;
}

export function ParentTemplateManager({
  questTemplates,
  onSaveTemplate,
  onToggleTemplateActive,
  onDeleteTemplate,
  showToast,
}) {
  const [editing, setEditing] = useState(EMPTY_TEMPLATE);
  const [query, setQuery] = useState("");
  const isEditingExisting = !!editing.id;
  const isSystemEditing = isEditingExisting && questTemplates.find((template) => template.id === editing.id)?.source === "system";
  const visibleTemplates = questTemplates.filter((template) => {
    const q = query.trim().toLowerCase();
    return !q || `${template.title} ${template.description}`.toLowerCase().includes(q);
  });

  function resetForm() {
    setEditing(EMPTY_TEMPLATE);
  }

  function handleEdit(template) {
    const rewards = splitRewardsOf(template);
    setEditing({
      id: template.id,
      title: template.title,
      description: template.description,
      ability: rewards ? rewards[0].statKey : template.ability,
      defaultXp: rewards ? rewards[0].xp : template.defaultXp,
      defaultType: template.defaultType,
      repeatDays: Array.isArray(template.repeatDays) && template.repeatDays.length ? template.repeatDays : ["daily"],
      isActive: template.isActive !== false,
      secondaryAbility: rewards ? rewards[1].statKey : null,
      secondaryXp: rewards ? rewards[1].xp : 2,
    });
  }

  function handleSave() {
    if (!editing.title.trim()) return;
    const hasSecondary = !!editing.secondaryAbility && editing.secondaryAbility !== editing.ability;
    const primaryXp = hasSecondary ? clampSplitXp(editing.defaultXp) : clampXp(editing.defaultXp);
    onSaveTemplate({
      ...editing,
      title: editing.title.trim(),
      description: editing.description.trim(),
      defaultXp: primaryXp,
      rewards: hasSecondary
        ? [
            { statKey: editing.ability, xp: primaryXp },
            { statKey: editing.secondaryAbility, xp: clampSplitXp(editing.secondaryXp) },
          ]
        : null,
      repeatDays: editing.repeatDays?.length ? editing.repeatDays : ["daily"],
      source: isSystemEditing ? "system" : "custom",
    });
    showToast(isEditingExisting ? "템플릿을 수정했어요" : "새 템플릿을 만들었어요", "success");
    resetForm();
  }

  function handleDelete(template) {
    const ok = onDeleteTemplate(template.id);
    showToast(ok ? "템플릿을 삭제했어요" : "시스템 기본 템플릿은 삭제할 수 없어요", ok ? "success" : "error");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card" style={{ marginTop: 4 }}>
        <div className="parent-card-title">퀘스트 템플릿 관리</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          우리 아이에게 맞는 학습, 취미, 생활 습관 퀘스트를 직접 만들 수 있어요.
        </div>

        <TemplateForm
          editing={editing}
          isSystemEditing={isSystemEditing}
          setEditing={setEditing}
          onSave={handleSave}
          onCancel={resetForm}
        />
      </div>

      <div className="parent-card">
        <div className="parent-card-title">저장된 템플릿</div>
        <input
          className="text-input compact"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="템플릿 검색"
          aria-label="템플릿 검색"
        />
        {visibleTemplates.map((template) => (
          <div className={`template-card compact ${template.isActive === false ? "inactive" : ""}`} key={template.id}>
            <div className="template-card-top">
              <div className="pending-emoji" aria-hidden="true">{template.emoji}</div>
              <div className="pending-info">
                <div className="pending-title">{template.title}</div>
                <div className="pending-meta">
                  {template.source === "system" ? "시스템 기본" : "직접 만든 템플릿"} · {QUEST_TYPE_LABEL[template.defaultType]} ·{" "}
                  {splitRewardsOf(template)
                    ? splitRewardsOf(template)
                        .map((reward) => `${STATS[reward.statKey]?.name || reward.statKey} +${reward.xp}`)
                        .join(" · ")
                    : `+${template.defaultXp} XP`}
                </div>
              </div>
            </div>
            <div className="template-desc">{template.description}</div>
            <div className="repeat-badge" style={{ marginTop: 8 }}>[{repeatDaysLabel(template.repeatDays)}]</div>
            <div className="template-action-row">
              <button type="button" className="pbtn-text" onClick={() => handleEdit(template)}>수정</button>
              <button type="button" className="pbtn-text" onClick={() => onToggleTemplateActive(template.id)}>
                {template.isActive === false ? "활성화" : "비활성화"}
              </button>
              {template.source !== "system" && <button type="button" className="pbtn-text danger" onClick={() => handleDelete(template)}>삭제</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateForm({ editing, isSystemEditing, setEditing, onSave, onCancel }) {
  const hasSecondary = !!editing.secondaryAbility && editing.secondaryAbility !== editing.ability;
  const clampPrimaryXp = hasSecondary ? clampSplitXp : clampXp;
  return (
    <div>
      {isSystemEditing && (
        <div className="parent-card-sub" style={{ marginBottom: 10, color: "var(--amber-dark)" }}>
          시스템 기본 템플릿은 삭제할 수 없고, 내용 수정 대신 활성화 여부만 관리하는 것을 권장해요.
        </div>
      )}
      <div className="field-label">퀘스트 이름</div>
      <input className="text-input" value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} placeholder="예: 영어 단어 5개 보기" aria-label="퀘스트 이름" />

      <div className="field-label">설명 / 완료 조건</div>
      <textarea className="textarea-input" value={editing.description} onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))} placeholder="완료 조건을 적어주세요." aria-label="설명 또는 완료 조건" />

      <div className="field-label">성장 능력</div>
      <div className="chip-row">
        {STAT_LIST.map((stat) => (
          <button
            key={stat.key}
            type="button"
            className={`chip-btn ${editing.ability === stat.key ? "active-chip" : ""}`}
            style={editing.ability === stat.key ? { background: stat.color } : undefined}
            onClick={() => setEditing((prev) => ({
              ...prev,
              ability: stat.key,
              // 대표 능력치와 보조 보상이 같아지면 보조 보상을 해제
              secondaryAbility: prev.secondaryAbility === stat.key ? null : prev.secondaryAbility,
            }))}
          >
            {stat.emoji} {stat.name}
          </button>
        ))}
      </div>

      <div className="field-label">기본 퀘스트 종류</div>
      <div className="chip-row">
        {Object.entries(QUEST_TYPE_LABEL).map(([key, label]) => (
          <button key={key} type="button" className={`chip-btn ${editing.defaultType === key ? "active-chip" : ""}`} style={editing.defaultType === key ? { background: "#233140" } : undefined} onClick={() => setEditing((prev) => ({ ...prev, defaultType: key }))}>
            {label}
          </button>
        ))}
      </div>

      <div className="field-label">{hasSecondary ? `${STATS[editing.ability]?.name || ""} XP` : "기본 XP"}</div>
      <div className="xp-stepper">
        <button type="button" onClick={() => setEditing((prev) => ({ ...prev, defaultXp: clampPrimaryXp(prev.defaultXp - 1) }))} aria-label="경험치 줄이기">−</button>
        <div className="xp-stepper-value">+{editing.defaultXp} XP</div>
        <button type="button" onClick={() => setEditing((prev) => ({ ...prev, defaultXp: clampPrimaryXp(prev.defaultXp + 1) }))} aria-label="경험치 늘리기">+</button>
      </div>

      <div className="field-label">보조 보상 (선택)</div>
      <div className="parent-card-sub" style={{ marginBottom: 8 }}>
        한 퀘스트로 두 능력치에 XP를 나눠줄 수 있어요. 예: 지식 +2, 끈기 +2
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip-btn ${!editing.secondaryAbility ? "active-chip" : ""}`}
          style={!editing.secondaryAbility ? { background: "#233140" } : undefined}
          onClick={() => setEditing((prev) => ({
            ...prev,
            secondaryAbility: null,
            defaultXp: clampXp(prev.defaultXp),
          }))}
        >
          없음
        </button>
        {STAT_LIST.filter((stat) => stat.key !== editing.ability).map((stat) => (
          <button
            key={stat.key}
            type="button"
            className={`chip-btn ${editing.secondaryAbility === stat.key ? "active-chip" : ""}`}
            style={editing.secondaryAbility === stat.key ? { background: stat.color } : undefined}
            onClick={() => setEditing((prev) => ({ ...prev, secondaryAbility: stat.key }))}
          >
            {stat.emoji} {stat.name}
          </button>
        ))}
      </div>

      {hasSecondary && (
        <>
          <div className="field-label">{STATS[editing.secondaryAbility]?.name || ""} XP</div>
          <div className="xp-stepper">
            <button type="button" onClick={() => setEditing((prev) => ({ ...prev, secondaryXp: clampSplitXp(prev.secondaryXp - 1) }))} aria-label="보조 경험치 줄이기">−</button>
            <div className="xp-stepper-value">+{editing.secondaryXp} XP</div>
            <button type="button" onClick={() => setEditing((prev) => ({ ...prev, secondaryXp: clampSplitXp(prev.secondaryXp + 1) }))} aria-label="보조 경험치 늘리기">+</button>
          </div>
          <div className="parent-card-sub" style={{ marginTop: 6 }}>
            총 +{clampSplitXp(editing.defaultXp) + clampSplitXp(editing.secondaryXp)} XP
            ({STATS[editing.ability]?.name} +{clampSplitXp(editing.defaultXp)} · {STATS[editing.secondaryAbility]?.name} +{clampSplitXp(editing.secondaryXp)})
          </div>
        </>
      )}

      <div className="field-label">반복 요일</div>
      <RepeatDaysPicker
        value={editing.repeatDays}
        onChange={(repeatDays) => setEditing((prev) => ({ ...prev, repeatDays }))}
      />

      <label className="checkbox-row">
        <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing((prev) => ({ ...prev, isActive: e.target.checked }))} />
        <span>활성화</span>
      </label>

      <div className="template-action-row">
        <button type="button" className="pbtn-text dark" disabled={!editing.title.trim()} onClick={onSave}>저장</button>
        {editing.id && <button type="button" className="pbtn-text" onClick={onCancel}>새 템플릿 작성</button>}
      </div>
    </div>
  );
}

function RepeatDaysPicker({ value, onChange }) {
  const repeatDays = Array.isArray(value) ? value : ["daily"];
  const daily = repeatDays.includes("daily");

  function toggle(day, checked) {
    if (day === "daily") {
      onChange(checked ? ["daily"] : []);
      return;
    }

    const current = repeatDays.filter((item) => item !== "daily");
    const next = checked
      ? Array.from(new Set([...current, day]))
      : current.filter((item) => item !== day);
    onChange(next.length ? next : ["daily"]);
  }

  return (
    <div className="repeat-day-grid">
      {REPEAT_DAY_OPTIONS.map((option) => (
        <label className={`repeat-day-option ${daily && option.key !== "daily" ? "disabled" : ""}`} key={option.key}>
          <input
            type="checkbox"
            checked={repeatDays.includes(option.key)}
            disabled={daily && option.key !== "daily"}
            onChange={(e) => toggle(option.key, e.target.checked)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
