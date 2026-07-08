import { useMemo, useState } from "react";
import {
  QUEST_TYPE_LABEL,
  STAT_LIST,
  repeatDaysLabel,
} from "../../data/definitions";
import {
  addDaysToDateString,
  formatDateKorean,
  koreanWeekdayForDateString,
  weekdayCodeForDateString,
} from "../../storage/dateUtils";

function statMeta(statKey) {
  return STAT_LIST.find((item) => item.key === statKey) || STAT_LIST[0];
}

function isTemplateForDate(template, dateString) {
  const repeatDays = Array.isArray(template.repeatDays) && template.repeatDays.length
    ? template.repeatDays
    : ["daily"];
  const dayCode = weekdayCodeForDateString(dateString);
  return repeatDays.includes("daily") || repeatDays.includes(dayCode);
}

export function ParentBuilder({
  questTemplates,
  assignedQuests,
  todayDate,
  onAssignTemplateQuests,
  showToast,
}) {
  const [dateChoice, setDateChoice] = useState("today");
  const [customDate, setCustomDate] = useState(todayDate);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedDate = dateChoice === "today"
    ? todayDate
    : dateChoice === "tomorrow"
      ? addDaysToDateString(todayDate, 1)
      : customDate;
  const weekdayLabel = koreanWeekdayForDateString(selectedDate);

  const assignedTemplateIds = useMemo(() => new Set(
    assignedQuests
      .filter((quest) => quest.date === selectedDate && quest.templateId)
      .map((quest) => quest.templateId)
  ), [assignedQuests, selectedDate]);

  const visibleTemplates = useMemo(() => (
    questTemplates
      .filter((template) => template.isActive !== false)
      .filter((template) => showAllTemplates || isTemplateForDate(template, selectedDate))
  ), [questTemplates, selectedDate, showAllTemplates]);

  const assignableSelectedIds = useMemo(() => {
    const visibleIds = new Set(visibleTemplates.map((template) => template.id));
    return selectedIds.filter((id) => visibleIds.has(id) && !assignedTemplateIds.has(id));
  }, [assignedTemplateIds, selectedIds, visibleTemplates]);

  function toggleSelection(templateId, checked) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, templateId]));
      return prev.filter((id) => id !== templateId);
    });
  }

  function handleAssign() {
    const result = onAssignTemplateQuests(assignableSelectedIds, selectedDate);
    if (result.added > 0) {
      showToast(`${formatDateKorean(selectedDate)} 퀘스트 ${result.added}개를 등록했어요.`, "success");
      setSelectedIds([]);
      return;
    }
    if (result.duplicates > 0) {
      showToast("이미 등록된 퀘스트는 다시 만들지 않았어요.", "error");
      return;
    }
    showToast("등록할 퀘스트를 먼저 체크해 주세요.", "error");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card" style={{ marginTop: 4 }}>
        <div className="parent-card-title">오늘 퀘스트 등록</div>
        <div className="parent-card-sub">
          오늘 요일에 맞는 퀘스트가 표시돼요. 추가하고 싶은 퀘스트를 체크한 뒤 등록해 주세요.
        </div>

        <div className="date-tab-row">
          <button type="button" className={`date-tab ${dateChoice === "today" ? "active" : ""}`} onClick={() => setDateChoice("today")}>오늘</button>
          <button type="button" className={`date-tab ${dateChoice === "tomorrow" ? "active" : ""}`} onClick={() => setDateChoice("tomorrow")}>내일</button>
          <button type="button" className={`date-tab ${dateChoice === "custom" ? "active" : ""}`} onClick={() => setDateChoice("custom")}>날짜 선택</button>
        </div>
        {dateChoice === "custom" && (
          <input
            type="date"
            className="text-input compact"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value || todayDate)}
            aria-label="퀘스트 등록 날짜"
          />
        )}

        <div className="date-summary-card">
          <strong>날짜: {selectedDate}</strong>
          <span>{weekdayLabel}과 매일 반복 퀘스트가 표시됩니다.</span>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showAllTemplates}
            onChange={(e) => setShowAllTemplates(e.target.checked)}
          />
          <span>모든 템플릿 보기</span>
        </label>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          다른 요일의 퀘스트도 추가하고 싶다면 모든 템플릿 보기를 켜주세요.
        </div>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">등록할 퀘스트</div>
        {visibleTemplates.length === 0 && (
          <div className="empty-row">선택한 날짜에 표시할 활성 템플릿이 없어요.</div>
        )}

        <div className="simple-template-list">
          {visibleTemplates.map((template) => {
            const alreadyAssigned = assignedTemplateIds.has(template.id);
            const checked = alreadyAssigned || selectedIds.includes(template.id);
            const stat = statMeta(template.ability);
            return (
              <label className={`template-check-row ${alreadyAssigned ? "already-assigned" : ""}`} key={template.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={alreadyAssigned}
                  onChange={(e) => toggleSelection(template.id, e.target.checked)}
                />
                <span className="template-check-body">
                  <span className="template-check-title">{template.title}</span>
                  <span className="template-check-meta">
                    {QUEST_TYPE_LABEL[template.defaultType]} · {stat.emoji} {stat.name} · {template.defaultXp}XP
                  </span>
                  <span className="repeat-badge">[{repeatDaysLabel(template.repeatDays)}]</span>
                  {alreadyAssigned && <span className="assigned-note">이미 등록된 퀘스트예요.</span>}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          className="modal-btn dark"
          disabled={assignableSelectedIds.length === 0}
          onClick={handleAssign}
        >
          선택한 퀘스트 등록하기
        </button>
      </div>
    </div>
  );
}
