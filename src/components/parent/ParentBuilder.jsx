import { useMemo, useState } from "react";
import {
  QUEST_TYPE_LABEL,
  QUEST_TYPE_SHORT_LABEL,
  STAT_LIST,
  XP_MAX,
  XP_MIN,
  transformToQuestFlavor,
} from "../../data/definitions";
import { formatDateKorean, todaySeoulDateString, tomorrowSeoulDateString } from "../../storage/dateUtils";

function statColorTag(statKey) {
  const stat = STAT_LIST.find((item) => item.key === statKey) || STAT_LIST[0];
  return (
    <span className="qb-stat-tag" style={{ background: stat.light, color: stat.color }}>
      {stat.emoji} {stat.name}
    </span>
  );
}

function clampXp(next) {
  return Math.min(XP_MAX, Math.max(XP_MIN, Number(next) || XP_MIN));
}

export function ParentBuilder({
  questTemplates,
  todayDate,
  onAssignTemplateQuest,
  onAssignQuestSet,
  onAssignCustom,
  showToast,
}) {
  const [query, setQuery] = useState("");
  const [abilityFilter, setAbilityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("active");

  const activeTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questTemplates.filter((template) => {
      const textMatch = !q || `${template.title} ${template.storyTitle} ${template.description}`.toLowerCase().includes(q);
      const abilityMatch = abilityFilter === "all" || template.ability === abilityFilter;
      const sourceMatch = sourceFilter === "all" || (sourceFilter === "active" ? template.isActive !== false : template.source === sourceFilter);
      return textMatch && abilityMatch && sourceMatch;
    });
  }, [abilityFilter, query, questTemplates, sourceFilter]);

  function assignSet(dateString) {
    const result = onAssignQuestSet(dateString);
    if (result.added > 0) {
      showToast(`${formatDateKorean(dateString)} 기본 세트 ${result.added}개를 배정했어요`, "success");
      return;
    }
    showToast("이미 해당 날짜에 배정된 퀘스트예요", "error");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card" style={{ marginTop: 4 }}>
        <div className="parent-card-title">오늘의 빠른 배정</div>
        <div className="parent-card-sub">
          기본 퀘스트는 공통 루틴입니다. 우리 아이에게 맞는 학습이나 취미 퀘스트는 직접 추가해 주세요.
        </div>
        <div className="quick-action-row">
          <button type="button" className="modal-btn dark" onClick={() => assignSet(todayDate)}>오늘 기본 세트 배정</button>
          <button type="button" className="modal-btn" onClick={() => assignSet(tomorrowSeoulDateString())}>내일 기본 세트 배정</button>
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">퀘스트 템플릿 목록</div>
        <div className="parent-card-sub">
          필수는 꼭 해야 할 일, 선택은 아이가 고를 수 있는 일, 도전은 조금 더 어려운 성장 미션입니다.
        </div>
        <input
          className="text-input compact"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="퀘스트 검색"
          aria-label="퀘스트 템플릿 검색"
        />
        <div className="chip-row">
          <button type="button" className={`chip-btn ${sourceFilter === "active" ? "active-chip" : ""}`} style={sourceFilter === "active" ? { background: "#233140" } : undefined} onClick={() => setSourceFilter("active")}>활성</button>
          <button type="button" className={`chip-btn ${sourceFilter === "system" ? "active-chip" : ""}`} style={sourceFilter === "system" ? { background: "#233140" } : undefined} onClick={() => setSourceFilter("system")}>기본</button>
          <button type="button" className={`chip-btn ${sourceFilter === "custom" ? "active-chip" : ""}`} style={sourceFilter === "custom" ? { background: "#233140" } : undefined} onClick={() => setSourceFilter("custom")}>직접 만든</button>
          <button type="button" className={`chip-btn ${sourceFilter === "all" ? "active-chip" : ""}`} style={sourceFilter === "all" ? { background: "#233140" } : undefined} onClick={() => setSourceFilter("all")}>전체</button>
        </div>
        <div className="chip-row">
          <button type="button" className={`chip-btn ${abilityFilter === "all" ? "active-chip" : ""}`} style={abilityFilter === "all" ? { background: "#233140" } : undefined} onClick={() => setAbilityFilter("all")}>전체 능력</button>
          {STAT_LIST.map((stat) => (
            <button
              key={stat.key}
              type="button"
              className={`chip-btn ${abilityFilter === stat.key ? "active-chip" : ""}`}
              style={abilityFilter === stat.key ? { background: stat.color } : undefined}
              onClick={() => setAbilityFilter(stat.key)}
            >
              {stat.emoji} {stat.name}
            </button>
          ))}
        </div>

        {activeTemplates.length === 0 && <div className="empty-row">조건에 맞는 템플릿이 없어요</div>}
        {activeTemplates.map((template) => (
          <TemplateAssignCard
            key={template.id}
            template={template}
            onAssignTemplateQuest={onAssignTemplateQuest}
            showToast={showToast}
          />
        ))}
      </div>

      <div className="parent-card">
        <div className="parent-card-title">새 퀘스트 직접 등록</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          오늘만 쓸 단발성 퀘스트로 만들거나, 템플릿으로 저장해 다음에도 반복해서 사용할 수 있어요.
        </div>
        <CustomQuestForm onAssignCustom={onAssignCustom} showToast={showToast} />
      </div>
    </div>
  );
}

function TemplateAssignCard({ template, onAssignTemplateQuest, showToast }) {
  const [type, setType] = useState(template.defaultType);
  const [xp, setXp] = useState(template.defaultXp);
  const [customDate, setCustomDate] = useState(todaySeoulDateString());

  function assign(dateString) {
    const result = onAssignTemplateQuest(template.id, dateString, { type, xp });
    if (result.ok) {
      showToast(`"${template.title}" 퀘스트를 ${formatDateKorean(dateString)}에 배정했어요`, "success");
      return;
    }
    if (result.reason === "duplicate") {
      showToast("이미 해당 날짜에 배정된 퀘스트예요", "error");
      return;
    }
    showToast("템플릿을 찾지 못했어요", "error");
  }

  return (
    <div className={`template-card ${template.isActive === false ? "inactive" : ""}`}>
      <div className="template-card-top">
        <div className="pending-emoji" aria-hidden="true">{template.emoji}</div>
        <div className="pending-info">
          <div className="pending-title">{template.title}</div>
          <div className="pending-meta">
            {template.source === "system" ? "기본 퀘스트" : "직접 만든 퀘스트"} · {template.storyTitle}
          </div>
        </div>
        {statColorTag(template.ability)}
      </div>
      <div className="template-desc">{template.description}</div>
      <div className="template-control-grid">
        <div>
          <div className="field-label">종류</div>
          <div className="mini-seg">
            {Object.entries(QUEST_TYPE_SHORT_LABEL).map(([key, label]) => (
              <button type="button" key={key} className={type === key ? "active" : ""} onClick={() => setType(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="field-label">XP</div>
          <div className="xp-stepper compact">
            <button type="button" onClick={() => setXp((value) => clampXp(value - 1))} aria-label="경험치 줄이기">−</button>
            <div className="xp-stepper-value">+{xp}</div>
            <button type="button" onClick={() => setXp((value) => clampXp(value + 1))} aria-label="경험치 늘리기">+</button>
          </div>
        </div>
      </div>
      <div className="template-action-row">
        <button type="button" className="pbtn-text dark" disabled={template.isActive === false} onClick={() => assign(todaySeoulDateString())}>오늘 배정</button>
        <button type="button" className="pbtn-text" disabled={template.isActive === false} onClick={() => assign(tomorrowSeoulDateString())}>내일 배정</button>
      </div>
      <div className="template-date-row">
        <input type="date" className="text-input compact" value={customDate} onChange={(e) => setCustomDate(e.target.value)} aria-label={`${template.title} 배정 날짜`} />
        <button type="button" className="pbtn-text" disabled={template.isActive === false} onClick={() => assign(customDate)}>날짜 선택</button>
      </div>
    </div>
  );
}

function CustomQuestForm({ onAssignCustom, showToast }) {
  const [title, setTitle] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statKey, setStatKey] = useState("life");
  const [xp, setXp] = useState(8);
  const [type, setType] = useState("choice");
  const [dateChoice, setDateChoice] = useState("today");
  const [customDate, setCustomDate] = useState(todaySeoulDateString());
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const targetDate = dateChoice === "today" ? todaySeoulDateString()
    : dateChoice === "tomorrow" ? tomorrowSeoulDateString()
    : customDate;
  const flavor = title.trim() ? transformToQuestFlavor(title, statKey) : null;
  const resolvedStoryTitle = storyTitle.trim() || flavor?.title || title.trim();
  const resolvedDescription = description.trim() || flavor?.desc || "";

  function handleSubmit() {
    if (!title.trim()) return;
    const result = onAssignCustom({
      emoji: flavor?.emoji,
      title: title.trim(),
      storyTitle: resolvedStoryTitle,
      desc: resolvedDescription,
      description: resolvedDescription,
      statKey,
      xp,
      type,
      date: targetDate,
      saveAsTemplate,
    });
    showToast(
      saveAsTemplate && result.template
        ? "템플릿으로 저장하고 퀘스트를 배정했어요"
        : `"${title.trim()}" 퀘스트를 ${formatDateKorean(targetDate)}에 등록했어요`,
      "success"
    );
    setTitle("");
    setStoryTitle("");
    setDescription("");
    setSaveAsTemplate(false);
  }

  return (
    <div>
      <div className="field-label">퀘스트 이름</div>
      <input className="text-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 수학 문제 3개 풀기" aria-label="퀘스트 이름" />

      <div className="field-label">모험식 이름</div>
      <input className="text-input" value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="예: 숫자 미션 해결" aria-label="모험식 이름" />

      <div className="field-label">설명 / 완료 조건</div>
      <textarea className="textarea-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: 오늘 정한 수학 문제 3개를 풀어요." aria-label="설명 또는 완료 조건" />

      <div className="field-label">성장 능력</div>
      <div className="chip-row">
        {STAT_LIST.map((stat) => (
          <button key={stat.key} type="button" className={`chip-btn ${statKey === stat.key ? "active-chip" : ""}`} style={statKey === stat.key ? { background: stat.color } : undefined} onClick={() => setStatKey(stat.key)}>
            {stat.emoji} {stat.name}
          </button>
        ))}
      </div>

      <div className="field-label">퀘스트 종류</div>
      <div className="chip-row">
        {Object.entries(QUEST_TYPE_LABEL).map(([key, label]) => (
          <button key={key} type="button" className={`chip-btn ${type === key ? "active-chip" : ""}`} style={type === key ? { background: "#233140" } : undefined} onClick={() => setType(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="field-label">경험치 (4~12)</div>
      <div className="xp-stepper">
        <button type="button" onClick={() => setXp((value) => clampXp(value - 1))} aria-label="경험치 줄이기">−</button>
        <div className="xp-stepper-value">+{xp} XP</div>
        <button type="button" onClick={() => setXp((value) => clampXp(value + 1))} aria-label="경험치 늘리기">+</button>
      </div>

      <div className="field-label">적용 날짜</div>
      <div className="date-tab-row">
        <button type="button" className={`date-tab ${dateChoice === "today" ? "active" : ""}`} onClick={() => setDateChoice("today")}>오늘</button>
        <button type="button" className={`date-tab ${dateChoice === "tomorrow" ? "active" : ""}`} onClick={() => setDateChoice("tomorrow")}>내일</button>
        <button type="button" className={`date-tab ${dateChoice === "custom" ? "active" : ""}`} onClick={() => setDateChoice("custom")}>직접 선택</button>
      </div>
      {dateChoice === "custom" && (
        <input type="date" className="text-input" value={customDate} onChange={(e) => setCustomDate(e.target.value)} aria-label="날짜 직접 선택" />
      )}

      <label className="checkbox-row">
        <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
        <span>이 퀘스트를 템플릿으로 저장하기</span>
      </label>

      {title.trim() && (
        <div className="preview-box">
          <div className="preview-label">아이 화면에는 이렇게 보여요</div>
          <div className="preview-title">{flavor?.emoji} {title.trim()}</div>
          <div className="preview-desc">{resolvedDescription}</div>
        </div>
      )}

      <button type="button" className="modal-btn dark" disabled={!title.trim()} onClick={handleSubmit}>퀘스트로 등록하기</button>
    </div>
  );
}
