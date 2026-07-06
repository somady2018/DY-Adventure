import { useState, useMemo } from "react";
import { KidHome } from "./KidHome";
import { KidCharacter } from "./KidCharacter";
import { KidSkillTree } from "./KidSkillTree";
import { KidMessages } from "./KidMessages";
import { GuildLetterModal } from "./GuildLetterModal";
import { QuestDetailModal, CelebrationModal, LevelUpModal } from "./QuestDetailModal";
import { questsForDate } from "../../storage/state";
import { getDailyGuildLetter, getGuildMeta } from "../../data/definitions";

export function KidApp({ appState, actions, todayDate, onRequestParentMode }) {
  const [tab, setTab] = useState("home");
  const [activeQuest, setActiveQuest] = useState(null); // 상세 확인창에 띄운 퀘스트
  // 사용자가 닫은(consume 처리 전) 셀러브레이션을 한 번만 더 추적할 필요가 없도록,
  // pendingCelebrations 큐의 맨 앞 항목을 그대로 "현재 보여줄 셀러브레이션"으로 파생시킵니다.
  // (setState를 useEffect 안에서 직접 호출하지 않기 위한 구조)
  const celebrationQuestId = appState.pendingCelebrations[0] || null;
  const levelUp = appState.pendingLevelUps?.[0] || null;
  const profile = appState.profile;
  const guild = getGuildMeta(profile?.guild);
  const dailyLetter = getDailyGuildLetter(profile?.guild, todayDate);
  const shouldShowDailyLetter = !activeQuest && !levelUp && !celebrationQuestId &&
    appState.dailyLetter?.lastShownDate !== todayDate;

  const todayQuests = useMemo(
    () => questsForDate(appState.assignedQuests, todayDate),
    [appState.assignedQuests, todayDate]
  );

  const celebrationQuest = celebrationQuestId
    ? appState.assignedQuests.find((q) => q.id === celebrationQuestId)
    : null;

  function handleOpenQuest(quest) {
    setActiveQuest(quest);
  }

  function handleSubmit(questId) {
    actions.submitQuest(questId);
    setActiveQuest(null);
  }

  function handleRestart(questId) {
    actions.restartQuest(questId);
    setActiveQuest(null);
  }

  function closeCelebration() {
    if (celebrationQuestId) actions.consumeCelebration(celebrationQuestId);
  }

  function closeLevelUp() {
    if (levelUp) actions.consumeLevelUp(levelUp.id);
  }

  function closeDailyLetter() {
    actions.markDailyLetterShown(todayDate, dailyLetter.id);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <div className="topbar-title">{guild.icon} {guild.name}</div>
          <div className="topbar-sub">{profile.childName}의 오늘 퀘스트</div>
        </div>
        <button type="button" className="icon-btn" onClick={onRequestParentMode} aria-label="보호자 화면으로 이동">
          🔒
        </button>
      </div>

      {tab === "home" && (
        <KidHome
          quests={todayQuests}
          statXp={appState.statXp}
          totalXp={appState.totalXp}
          todayDate={todayDate}
          profile={profile}
          onOpenQuest={handleOpenQuest}
          messages={appState.parentMessages}
          onReadMessage={actions.markMessageRead}
        />
      )}
      {tab === "character" && <KidCharacter statXp={appState.statXp} totalXp={appState.totalXp} profile={profile} />}
      {tab === "skills" && <KidSkillTree statXp={appState.statXp} profile={profile} />}
      {tab === "messages" && (
        <KidMessages
          messages={appState.parentMessages}
          onReadMessage={actions.markMessageRead}
        />
      )}

      <div className="bottom-nav">
        <button type="button" className={`nav-item ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")} aria-label="오늘의 모험 화면으로 이동">
          <div className="nav-ico" aria-hidden="true">🗺️</div>
          <div className="nav-label">모험</div>
        </button>
        <button type="button" className={`nav-item ${tab === "character" ? "active" : ""}`} onClick={() => setTab("character")} aria-label="캐릭터 화면으로 이동">
          <div className="nav-ico" aria-hidden="true">🧭</div>
          <div className="nav-label">캐릭터</div>
        </button>
        <button type="button" className={`nav-item ${tab === "skills" ? "active" : ""}`} onClick={() => setTab("skills")} aria-label="스킬트리 화면으로 이동">
          <div className="nav-ico" aria-hidden="true">🌳</div>
          <div className="nav-label">스킬트리</div>
        </button>
        <button type="button" className={`nav-item ${tab === "messages" ? "active" : ""}`} onClick={() => setTab("messages")} aria-label="응원 메시지 화면으로 이동">
          <div className="nav-ico" aria-hidden="true">💌</div>
          <div className="nav-label">응원</div>
        </button>
      </div>

      {activeQuest && (
        <QuestDetailModal
          quest={todayQuests.find((q) => q.id === activeQuest.id) || activeQuest}
          onSubmit={handleSubmit}
          onRestart={handleRestart}
          onClose={() => setActiveQuest(null)}
        />
      )}

      {!activeQuest && celebrationQuest && (
        <CelebrationModal quest={celebrationQuest} onClose={closeCelebration} />
      )}
      {!activeQuest && !celebrationQuest && levelUp && (
        <LevelUpModal levelUp={levelUp} profile={profile} onClose={closeLevelUp} />
      )}
      {shouldShowDailyLetter && (
        <GuildLetterModal profile={profile} letter={dailyLetter} onClose={closeDailyLetter} />
      )}
    </div>
  );
}
