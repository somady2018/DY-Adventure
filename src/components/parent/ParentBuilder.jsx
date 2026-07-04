import { useState, useMemo } from "react";
import { STAT_LIST, QUEST_TEMPLATES, QUEST_TYPE_LABEL, transformToQuestFlavor, XP_MIN, XP_MAX } from "../../data/definitions";
import { todaySeoulDateString, tomorrowSeoulDateString, formatDateKorean } from "../../storage/dateUtils";

function statColorTag(statKey) {
  const s = STAT_LIST.find((x) => x.key === statKey);
  return (
    <span className="qb-stat-tag" style={{ background: s.light, color: s.color }}>
      {s.emoji} {s.name}
    </span>
  );
}

export function ParentBuilder({ activeTemplateIds, todayDate, onToggleTemplate, onAssignCustom, showToast }) {
  const [seg, setSeg] = useState("recommend");

  return (
    <div className="fade-slide">
      <div className="seg-control" style={{ marginTop: 4 }}>
        <button type="button" className={seg === "recommend" ? "active" : ""} onClick={() => setSeg("recommend")}>추천 퀘스트</button>
        <button type="button" className={seg === "custom" ? "active" : ""} onClick={() => setSeg("custom")}>직접 만들기</button>
      </div>

      {seg === "recommend" && (
        <div className="parent-card">
          <div className="parent-card-title">오늘의 추천 목록</div>
          <div className="parent-card-sub">체크를 해제하면 그 즉시 아이 화면의 오늘 목록에서도 제외돼요.</div>
          <div style={{ marginTop: 6 }}>
            {QUEST_TEMPLATES.map((q) => {
              const on = activeTemplateIds.includes(q.templateId);
              return (
                <div className="quest-builder-row" key={q.templateId}>
                  <button
                    type="button"
                    className={`qb-checkbox ${on ? "on" : ""}`}
                    onClick={() => onToggleTemplate(q.templateId, todayDate)}
                    aria-pressed={on}
                    aria-label={`${q.title} ${on ? "비활성화" : "활성화"}`}
                  >
                    {on ? "✓" : ""}
                  </button>
                  <div className="qb-label">{q.emoji} {q.title}</div>
                  {statColorTag(q.statKey)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {seg === "custom" && (
        <div className="parent-card">
          <div className="parent-card-title">새 퀘스트 만들기</div>
          <div className="parent-card-sub" style={{ marginBottom: 10 }}>
            평범한 문장을 적어도, 아이 화면에는 모험 이야기로 바뀌어서 보여요.
          </div>
          <CustomQuestForm onAssignCustom={onAssignCustom} showToast={showToast} />
        </div>
      )}
    </div>
  );
}

function CustomQuestForm({ onAssignCustom, showToast }) {
  const [text, setText] = useState("");
  const [statKey, setStatKey] = useState("life");
  const [xp, setXp] = useState(8);
  const [type, setType] = useState("choice");
  const [dateChoice, setDateChoice] = useState("today");
  const [customDate, setCustomDate] = useState(todaySeoulDateString());

  const targetDate = dateChoice === "today" ? todaySeoulDateString()
    : dateChoice === "tomorrow" ? tomorrowSeoulDateString()
    : customDate;

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    return transformToQuestFlavor(text, statKey);
  }, [text, statKey]);

  function clampXp(next) {
    return Math.min(XP_MAX, Math.max(XP_MIN, next));
  }

  function handleSubmit() {
    if (!text.trim()) return;
    const flavor = transformToQuestFlavor(text, statKey);
    onAssignCustom({
      emoji: flavor.emoji,
      title: flavor.title,
      desc: flavor.desc,
      statKey,
      xp,
      type,
      date: targetDate,
    });
    showToast(`"${flavor.title}" 퀘스트를 ${formatDateKorean(targetDate)}에 등록했어요`, "success");
    setText("");
    setXp(8);
  }

  return (
    <div>
      <div className="field-label">할 일 (평범하게 적어주세요)</div>
      <input
        type="text"
        className="text-input"
        placeholder="예: 책 15분 읽기"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="할 일 입력"
      />

      <div className="field-label">어떤 능력치와 연결할까요?</div>
      <div className="chip-row">
        {STAT_LIST.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`chip-btn ${statKey === s.key ? "active-chip" : ""}`}
            style={statKey === s.key ? { background: s.color } : undefined}
            onClick={() => setStatKey(s.key)}
            aria-pressed={statKey === s.key}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      <div className="field-label">퀘스트 종류</div>
      <div className="chip-row">
        {Object.entries(QUEST_TYPE_LABEL).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip-btn ${type === key ? "active-chip" : ""}`}
            style={type === key ? { background: "#233140" } : undefined}
            onClick={() => setType(key)}
            aria-pressed={type === key}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="field-label">경험치 (4~12)</div>
      <div className="xp-stepper">
        <button type="button" onClick={() => setXp((v) => clampXp(v - 1))} aria-label="경험치 줄이기">−</button>
        <div className="xp-stepper-value">+{xp} XP</div>
        <button type="button" onClick={() => setXp((v) => clampXp(v + 1))} aria-label="경험치 늘리기">+</button>
      </div>

      <div className="field-label">적용 날짜</div>
      <div className="date-tab-row">
        <button type="button" className={`date-tab ${dateChoice === "today" ? "active" : ""}`} onClick={() => setDateChoice("today")}>오늘</button>
        <button type="button" className={`date-tab ${dateChoice === "tomorrow" ? "active" : ""}`} onClick={() => setDateChoice("tomorrow")}>내일</button>
        <button type="button" className={`date-tab ${dateChoice === "custom" ? "active" : ""}`} onClick={() => setDateChoice("custom")}>직접 선택</button>
      </div>
      {dateChoice === "custom" && (
        <input
          type="date"
          className="text-input"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          aria-label="날짜 직접 선택"
        />
      )}

      {preview && (
        <div className="preview-box">
          <div className="preview-label">도영이 화면에는 이렇게 보여요</div>
          <div className="preview-title">{preview.emoji} {preview.title}</div>
          <div className="preview-desc">{preview.desc}</div>
        </div>
      )}

      <button type="button" className="modal-btn dark" disabled={!text.trim()} onClick={handleSubmit}>
        퀘스트로 등록하기
      </button>
    </div>
  );
}
