import { useState } from "react";
import { QUEST_TYPE_LABEL, STAT_LIST, XP_MAX, XP_MIN } from "../../data/definitions";

const EMPTY_TEMPLATE = {
  id: null,
  title: "",
  storyTitle: "",
  description: "",
  ability: "life",
  defaultXp: 6,
  defaultType: "choice",
  isActive: true,
};

function clampXp(value) {
  return Math.min(XP_MAX, Math.max(XP_MIN, Number(value) || XP_MIN));
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
    return !q || `${template.title} ${template.storyTitle} ${template.description}`.toLowerCase().includes(q);
  });

  function resetForm() {
    setEditing(EMPTY_TEMPLATE);
  }

  function handleEdit(template) {
    setEditing({
      id: template.id,
      title: template.title,
      storyTitle: template.storyTitle,
      description: template.description,
      ability: template.ability,
      defaultXp: template.defaultXp,
      defaultType: template.defaultType,
      isActive: template.isActive !== false,
    });
  }

  function handleSave() {
    if (!editing.title.trim()) return;
    onSaveTemplate({
      ...editing,
      title: editing.title.trim(),
      storyTitle: editing.storyTitle.trim() || editing.title.trim(),
      description: editing.description.trim(),
      defaultXp: clampXp(editing.defaultXp),
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
                  {template.source === "system" ? "시스템 기본" : "직접 만든 템플릿"} · {QUEST_TYPE_LABEL[template.defaultType]} · +{template.defaultXp} XP
                </div>
              </div>
            </div>
            <div className="template-desc">{template.description}</div>
            <div className="template-action-row">
              {template.source !== "system" && <button type="button" className="pbtn-text" onClick={() => handleEdit(template)}>수정</button>}
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
  return (
    <div>
      {isSystemEditing && (
        <div className="parent-card-sub" style={{ marginBottom: 10, color: "var(--amber-dark)" }}>
          시스템 기본 템플릿은 삭제할 수 없고, 내용 수정 대신 활성화 여부만 관리하는 것을 권장해요.
        </div>
      )}
      <div className="field-label">퀘스트 이름</div>
      <input className="text-input" value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} placeholder="예: 영어 단어 5개 보기" aria-label="퀘스트 이름" />

      <div className="field-label">모험식 이름</div>
      <input className="text-input" value={editing.storyTitle} onChange={(e) => setEditing((prev) => ({ ...prev, storyTitle: e.target.value }))} placeholder="예: 단어 조각 모으기" aria-label="모험식 이름" />

      <div className="field-label">설명 / 완료 조건</div>
      <textarea className="textarea-input" value={editing.description} onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))} placeholder="완료 조건을 적어주세요." aria-label="설명 또는 완료 조건" />

      <div className="field-label">성장 능력</div>
      <div className="chip-row">
        {STAT_LIST.map((stat) => (
          <button key={stat.key} type="button" className={`chip-btn ${editing.ability === stat.key ? "active-chip" : ""}`} style={editing.ability === stat.key ? { background: stat.color } : undefined} onClick={() => setEditing((prev) => ({ ...prev, ability: stat.key }))}>
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

      <div className="field-label">기본 XP</div>
      <div className="xp-stepper">
        <button type="button" onClick={() => setEditing((prev) => ({ ...prev, defaultXp: clampXp(prev.defaultXp - 1) }))} aria-label="경험치 줄이기">−</button>
        <div className="xp-stepper-value">+{editing.defaultXp} XP</div>
        <button type="button" onClick={() => setEditing((prev) => ({ ...prev, defaultXp: clampXp(prev.defaultXp + 1) }))} aria-label="경험치 늘리기">+</button>
      </div>

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
