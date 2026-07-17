import { useRef, useState } from "react";
import { ConfirmDialog } from "../shared/Shared";
import { isValidPinFormat } from "../../storage/pin";
import { isNativeApp } from "../../storage/nativeMirror";
import { isShareCanceled, shareBackupFile } from "../../storage/nativeShare";

export function ParentDataManager({ exportJson, importState, changePin, resetAllData, showToast }) {
  const [confirmStep, setConfirmStep] = useState(0);
  const [pendingImportText, setPendingImportText] = useState(null);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [nextPinConfirm, setNextPinConfirm] = useState("");
  const fileInputRef = useRef(null);

  function cleanPin(value) {
    return value.replace(/\D/g, "").slice(0, 4);
  }

  async function handleExport() {
    const json = exportJson();
    const fileName = `오늘의모험-데이터-${new Date().toISOString().slice(0, 10)}.json`;

    // 안드로이드 앱: WebView는 <a download>를 지원하지 않으므로 공유 시트 사용
    if (isNativeApp()) {
      try {
        await shareBackupFile(fileName, json);
        showToast("백업 파일을 저장했어요.", "success");
      } catch (err) {
        if (!isShareCanceled(err)) {
          console.error("백업 공유 실패", err);
          showToast("백업 파일 저장에 실패했어요.", "error");
        }
      }
      return;
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("데이터를 내보냈어요.", "success");
  }

  function handleImportButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImportText(String(reader.result || ""));
    reader.onerror = () => showToast("파일을 읽지 못했어요.", "error");
    reader.readAsText(file);
  }

  function handleImportConfirmed() {
    try {
      importState(pendingImportText);
      showToast("데이터를 복원했어요.", "success");
    } catch (err) {
      showToast(err?.message || "복원에 실패했어요. 올바른 파일인지 확인해 주세요.", "error");
    } finally {
      setPendingImportText(null);
    }
  }

  function handleImportCancel() {
    setPendingImportText(null);
  }

  async function handleChangePin() {
    if (![currentPin, nextPin, nextPinConfirm].every(isValidPinFormat)) {
      showToast("PIN은 4자리 숫자로 입력해 주세요.", "error");
      return;
    }
    if (nextPin !== nextPinConfirm) {
      showToast("새 PIN이 서로 달라요.", "error");
      return;
    }
    try {
      const ok = await changePin(currentPin, nextPin);
      if (!ok) {
        showToast("현재 PIN이 맞지 않아요.", "error");
        return;
      }
      setCurrentPin("");
      setNextPin("");
      setNextPinConfirm("");
      showToast("보호자 PIN을 바꿨어요.", "success");
    } catch (err) {
      console.error("PIN change failed", err);
      showToast("PIN 변경에 실패했어요. 다시 시도해 주세요.", "error");
    }
  }

  function handleResetConfirmed() {
    resetAllData();
    setConfirmStep(0);
    showToast("모든 데이터를 초기화했어요.", "success");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card">
        <div className="parent-card-title">데이터 내보내기 / 가져오기</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          퀘스트, 경험치, 메시지 기록을 JSON 파일로 저장하거나 이전 백업 파일에서 복원할 수 있어요.
          새 백업에는 보호자 PIN 복원에 필요한 정보도 함께 포함돼요.
        </div>
        <button type="button" className="modal-btn dark" onClick={handleExport}>
          JSON 파일로 내보내기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          className="modal-btn ghost"
          style={{ marginTop: 8 }}
          onClick={handleImportButtonClick}
        >
          백업 파일로 복원하기
        </button>
      </div>

      <div className="parent-card">
        <div className="parent-card-title">보호자 PIN 변경</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          현재 PIN을 확인한 뒤 새 4자리 번호로 바꿀 수 있어요.
        </div>
        <input
          className="text-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="현재 PIN"
          value={currentPin}
          onChange={(e) => setCurrentPin(cleanPin(e.target.value))}
        />
        <input
          className="text-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="새 PIN"
          value={nextPin}
          onChange={(e) => setNextPin(cleanPin(e.target.value))}
        />
        <input
          className="text-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="새 PIN 다시 입력"
          value={nextPinConfirm}
          onChange={(e) => setNextPinConfirm(cleanPin(e.target.value))}
        />
        <button type="button" className="modal-btn dark" onClick={handleChangePin}>
          PIN 변경하기
        </button>
      </div>

      <div className="danger-zone">
        <div className="parent-card-title">전체 데이터 초기화</div>
        <div className="parent-card-sub" style={{ marginBottom: 10, color: "var(--coral-dark)" }}>
          모든 퀘스트 기록, 경험치, 메시지, 보호자 PIN이 삭제돼요. 되돌릴 수 없으니 먼저 내보내기를 권장해요.
        </div>
        <button type="button" className="modal-btn danger" onClick={() => setConfirmStep(1)}>
          모든 데이터 초기화하기
        </button>
      </div>

      {pendingImportText !== null && (
        <ConfirmDialog
          title="파일로 복원할까요?"
          message="선택한 파일 내용으로 현재 저장된 퀘스트, 경험치, 메시지를 덮어써요. 파일에 PIN 복원 정보가 있으면 보호자 PIN도 함께 복원돼요."
          confirmLabel="복원하기"
          danger
          onConfirm={handleImportConfirmed}
          onCancel={handleImportCancel}
        />
      )}

      {confirmStep === 1 && (
        <ConfirmDialog
          title="정말 초기화할까요?"
          message="아이의 모든 퀘스트와 경험치 기록이 사라져요. 계속하려면 한 번 더 확인할게요."
          confirmLabel="계속하기"
          danger
          onConfirm={() => setConfirmStep(2)}
          onCancel={() => setConfirmStep(0)}
        />
      )}
      {confirmStep === 2 && (
        <ConfirmDialog
          title="마지막 확인이에요"
          message="이 작업은 되돌릴 수 없어요. 정말로 모든 데이터를 초기화할까요?"
          confirmLabel="네, 초기화합니다"
          danger
          onConfirm={handleResetConfirmed}
          onCancel={() => setConfirmStep(0)}
        />
      )}
    </div>
  );
}
