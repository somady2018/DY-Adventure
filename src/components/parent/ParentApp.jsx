import { useState } from "react";
import { ParentToday } from "./ParentToday";
import { ParentBuilder } from "./ParentBuilder";
import { ParentReport } from "./ParentReport";
import { ParentDataManager } from "./ParentDataManager";
import { questsForDate } from "../../storage/state";

export function ParentApp({ appState, actions, todayDate, onBackToKid, showToast }) {
  const [tab, setTab] = useState("today");
  const todayQuests = questsForDate(appState.assignedQuests, todayDate);

  return (
    <div className="screen parent-screen">
      <div className="topbar">
        <div>
          <div className="topbar-title">보호자 화면</div>
          <div className="topbar-sub" style={{ color: "#8A95A1" }}>도영이의 모험을 관리해요</div>
        </div>
        <button type="button" className="icon-btn" onClick={onBackToKid} aria-label="아이 화면으로 돌아가기">
          ←
        </button>
      </div>

      <div className="screen-scroll">
        <span className="child-switch-pill">
          <span className="csp-avatar" aria-hidden="true">🧭</span> 도영 (만 8세)
        </span>

        <div className="seg-control">
          <button type="button" className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>오늘</button>
          <button type="button" className={tab === "build" ? "active" : ""} onClick={() => setTab("build")}>퀘스트 등록</button>
          <button type="button" className={tab === "report" ? "active" : ""} onClick={() => setTab("report")}>주간 리포트</button>
          <button type="button" className={tab === "data" ? "active" : ""} onClick={() => setTab("data")}>데이터</button>
        </div>

        {tab === "today" && (
          <ParentToday
            quests={todayQuests}
            onApprove={actions.approveQuest}
            onRequestRetry={actions.requestRetry}
          />
        )}
        {tab === "build" && (
          <ParentBuilder
            activeTemplateIds={appState.activeTemplateIds}
            todayDate={todayDate}
            onToggleTemplate={actions.toggleTemplateActive}
            onAssignCustom={actions.assignCustomQuest}
            showToast={showToast}
          />
        )}
        {tab === "report" && (
          <ParentReport
            assignedQuests={appState.assignedQuests}
            onSendMessage={actions.sendParentMessage}
            showToast={showToast}
          />
        )}
        {tab === "data" && (
          <ParentDataManager
            exportJson={actions.exportJson}
            importState={actions.importState}
            resetAllData={actions.resetAllData}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
