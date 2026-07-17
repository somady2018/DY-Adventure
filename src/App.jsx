import { useState, useEffect } from "react";
import { useAppState } from "./hooks/useAppState";
import { useToast } from "./hooks/useToast";
import { todaySeoulDateString } from "./storage/dateUtils";
import { KidApp } from "./components/kid/KidApp";
import { Onboarding } from "./components/kid/Onboarding";
import { ParentApp } from "./components/parent/ParentApp";
import { PinGate } from "./components/parent/PinGate";
import { Toast } from "./components/shared/Shared";
import { getGuildTheme, normalizeGuildKey } from "./data/definitions";

export default function App() {
  const appStateApi = useAppState();
  const { state, hasPinSet, setupPin, checkPin, resetParentPin, ensureTemplatesAssignedForDate } = appStateApi;
  const { toast, showToast } = useToast();
  const guildKey = normalizeGuildKey(state.profile?.guild);
  const guildTheme = getGuildTheme(guildKey);
  const themeStyle = {
    "--guild-primary": guildTheme.primary,
    "--guild-primary-soft": guildTheme.primarySoft,
    "--guild-primary-deep": guildTheme.primaryDeep,
    "--guild-accent": guildTheme.accent,
    "--guild-accent-soft": guildTheme.accentSoft,
  };

  // mode: "kid" | "pin" | "parent"
  // 요구사항 3: 자유로운 토글 버튼 대신, 보호자 화면 진입은 항상 PIN 게이트를 거칩니다.
  const [mode, setMode] = useState("kid");
  const [todayDate, setTodayDate] = useState(() => todaySeoulDateString());

  // 오늘 날짜에 해당하는 반복 템플릿들이 아직 배정되지 않았다면 배정합니다.
  // (최초 실행 시 + 자정을 넘겨 날짜가 바뀌었을 때)
  const scheduledTemplateKey = state.questTemplates
    .filter((template) => template.isActive !== false)
    .map((template) => `${template.id}:${template.defaultType}:${template.defaultXp}:${(template.repeatDays || []).join(",")}`)
    .join("|");

  useEffect(() => {
    if (!state.profile?.guild) return;
    ensureTemplatesAssignedForDate(todayDate);
  }, [ensureTemplatesAssignedForDate, scheduledTemplateKey, state.createdAt, state.profile?.guild, todayDate]);

  // 자정 경과를 감지해 todayDate를 갱신 (앱을 켜둔 채로 날짜가 바뀌는 경우 대비)
  useEffect(() => {
    const interval = setInterval(() => {
      const next = todaySeoulDateString();
      setTodayDate((prev) => (prev !== next ? next : prev));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function requestParentMode() {
    setMode("pin");
  }

  function handlePinSuccess() {
    setMode("parent");
  }

  function backToKid() {
    setMode("kid");
  }

  return (
    <div className="device" data-guild={guildKey} style={themeStyle}>
      {mode === "kid" && !state.profile?.guild && (
        <Onboarding onComplete={appStateApi.saveProfile} />
      )}
      {mode === "kid" && state.profile?.guild && (
        <KidApp
          appState={state}
          actions={appStateApi}
          todayDate={todayDate}
          onRequestParentMode={requestParentMode}
        />
      )}
      {mode === "pin" && (
        <PinGate
          hasPinSet={hasPinSet}
          setupPin={setupPin}
          checkPin={checkPin}
          resetPin={resetParentPin}
          onSuccess={handlePinSuccess}
          onBack={backToKid}
        />
      )}
      {mode === "parent" && (
        <ParentApp
          appState={state}
          actions={appStateApi}
          todayDate={todayDate}
          onBackToKid={backToKid}
          showToast={showToast}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
