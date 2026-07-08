import { useEffect, useMemo, useState } from "react";
import {
  QUEST_TYPE_LABEL,
  STAT_LIST,
  repeatDaysLabel,
} from "../../data/definitions";
import {
  addDaysToDateString,
  koreanWeekdayForDateString,
  weekdayCodeForDateString,
} from "../../storage/dateUtils";

function statMeta(statKey) {
  return STAT_LIST.find((item) => item.key === statKey) || STAT_LIST[0];
}

function repeatDays(template) {
  return Array.isArray(template.repeatDays) && template.repeatDays.length
    ? template.repeatDays
    : ["daily"];
}

function isTemplateForDate(template, dateString) {
  const dayCode = weekdayCodeForDateString(dateString);
  const days = repeatDays(template);
  return days.includes("daily") || days.includes(dayCode);
}

function isDailyTemplate(template) {
  return repeatDays(template).includes("daily");
}

export function ParentBuilder({
  questTemplates,
  assignedQuests,
  todayDate,
  onAssignTemplateQuests,
  onRemoveTemplateQuestForDate,
  showToast,
}) {
  const [dateChoice, setDateChoice] = useState("today");
  const [customDate, setCustomDate] = useState(todayDate);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [deselectedDailyByDate, setDeselectedDailyByDate] = useState({});
  const selectedDate = dateChoice === "today"
    ? todayDate
    : dateChoice === "tomorrow"
      ? addDaysToDateString(todayDate, 1)
      : customDate;
  const weekdayLabel = koreanWeekdayForDateString(selectedDate);

  const visibleTemplates = useMemo(() => (
    questTemplates
      .filter((template) => template.isActive !== false)
      .filter((template) => showAllTemplates || isTemplateForDate(template, selectedDate))
  ), [questTemplates, selectedDate, showAllTemplates]);

  const assignedByTemplateId = useMemo(() => {
    const map = new Map();
    assignedQuests
      .filter((quest) => quest.date === selectedDate && quest.templateId)
      .forEach((quest) => map.set(quest.templateId, quest));
    return map;
  }, [assignedQuests, selectedDate]);

  const autoDailyTemplateIds = useMemo(() => (
    visibleTemplates
      .filter((template) => isDailyTemplate(template))
      .filter((template) => !(deselectedDailyByDate[selectedDate] || []).includes(template.id))
      .filter((template) => !assignedByTemplateId.has(template.id))
      .map((template) => template.id)
  ), [assignedByTemplateId, deselectedDailyByDate, selectedDate, visibleTemplates]);

  useEffect(() => {
    if (autoDailyTemplateIds.length === 0) return;
    onAssignTemplateQuests(autoDailyTemplateIds, selectedDate);
  }, [autoDailyTemplateIds, onAssignTemplateQuests, selectedDate]);

  function handleToggle(template, checked) {
    if (checked) {
      if (isDailyTemplate(template)) {
        setDeselectedDailyByDate((prev) => {
          const current = (prev[selectedDate] || []).filter((id) => id !== template.id);
          return { ...prev, [selectedDate]: current };
        });
      }
      const result = onAssignTemplateQuests([template.id], selectedDate);
      if (result.added > 0) {
        showToast(`"${template.title}" 퀘스트를 등록했어요.`, "success");
      }
      return;
    }

    const daily = isDailyTemplate(template);
    if (daily) {
      setDeselectedDailyByDate((prev) => {
        const current = new Set(prev[selectedDate] || []);
        current.add(template.id);
        return { ...prev, [selectedDate]: Array.from(current) };
      });
    }

    const result = onRemoveTemplateQuestForDate(template.id, selectedDate);
    if (result.ok) {
      showToast(`"${template.title}" 퀘스트를 제외했어요.`, "success");
      return;
    }
    if (result.reason === "locked") {
      showToast("이미 진행 중이거나 완료된 퀘스트는 여기서 제외하지 않았어요.", "error");
      return;
    }
    if (daily) {
      showToast(`"${template.title}" 퀘스트를 오늘은 제외했어요.`, "success");
      return;
    }
    showToast("아직 등록되지 않은 퀘스트예요.", "error");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card" style={{ marginTop: 4 }}>
        <div className="parent-card-title">오늘 퀘스트 등록</div>
        <div className="parent-card-sub">
          체크하면 바로 등록되고, 체크를 해제하면 아직 시작 전인 퀘스트는 바로 제외돼요.
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
            const assignedQuest = assignedByTemplateId.get(template.id);
            const dailyDeselected = (deselectedDailyByDate[selectedDate] || []).includes(template.id);
            const checked = !!assignedQuest || (isDailyTemplate(template) && !dailyDeselected);
            const locked = assignedQuest && assignedQuest.status !== "open";
            const stat = statMeta(template.ability);
            return (
              <label className={`template-check-row ${assignedQuest ? "already-assigned" : ""}`} key={template.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => handleToggle(template, e.target.checked)}
                />
                <span className="template-check-body">
                  <span className="template-check-title">{template.title}</span>
                  <span className="template-check-meta">
                    {QUEST_TYPE_LABEL[template.defaultType]} · {stat.emoji} {stat.name} · {template.defaultXp}XP
                  </span>
                  <span className="repeat-badge">[{repeatDaysLabel(template.repeatDays)}]</span>
                  {assignedQuest && <span className="assigned-note">선택한 날짜에 등록된 퀘스트예요.</span>}
                  {locked && <span className="assigned-note">진행 중이거나 완료되어 여기서는 해제할 수 없어요.</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
