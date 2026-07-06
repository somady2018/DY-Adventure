import { useRef, useState } from "react";
import { ConfirmDialog } from "../shared/Shared";

export function ParentDataManager({ exportJson, importState, resetAllData, showToast }) {
  const [confirmStep, setConfirmStep] = useState(0);
  const [pendingImportText, setPendingImportText] = useState(null);
  const fileInputRef = useRef(null);

  function handleExport() {
    const json = exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `오늘의모험_데이터_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("데이터를 내보냈어요", "success");
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
    reader.onerror = () => showToast("파일을 읽지 못했어요", "error");
    reader.readAsText(file);
  }

  function handleImportConfirmed() {
    try {
      importState(pendingImportText);
      showToast("데이터를 복원했어요", "success");
    } catch (err) {
      showToast(err?.message || "복원에 실패했어요. 올바른 파일인지 확인해주세요.", "error");
    } finally {
      setPendingImportText(null);
    }
  }

  function handleImportCancel() {
    setPendingImportText(null);
  }

  function handleResetConfirmed() {
    resetAllData();
    setConfirmStep(0);
    showToast("모든 데이터를 초기화했어요", "success");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card">
        <div className="parent-card-title">📦 데이터 내보내기 / 가져오기</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          지금까지의 퀘스트, 경험치, 승인 기록, 메시지를 JSON 파일로 저장하거나, 이전에
          내보내둔 파일을 다시 불러와 복원할 수 있어요.
        </div>
        <button type="button" className="modal-btn dark" onClick={handleExport}>JSON 파일로 내보내기</button>
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
          내보낸 파일로 복원하기
        </button>
      </div>

      <div className="danger-zone">
        <div className="parent-card-title">⚠️ 전체 데이터 초기화</div>
        <div className="parent-card-sub" style={{ marginBottom: 10, color: "var(--coral-dark)" }}>
          모든 퀘스트 기록, 경험치, 메시지가 영구히 삭제돼요. 되돌릴 수 없으니 내보내기를 먼저 해두는 걸 권장해요.
        </div>
        <button type="button" className="modal-btn danger" onClick={() => setConfirmStep(1)}>모든 데이터 초기화하기</button>
      </div>

      {pendingImportText !== null && (
        <ConfirmDialog
          title="파일로 복원할까요?"
          message="선택한 파일 내용으로 현재 저장된 퀘스트·경험치·메시지를 덮어써요. 파일에 없는 최근 기록은 사라질 수 있으니, 최신 상태를 먼저 내보내기 해뒀는지 확인해주세요."
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
          message="이 작업은 되돌릴 수 없어요. 정말로 모든 데이터를 초기화하시겠어요?"
          confirmLabel="네, 초기화합니다"
          danger
          onConfirm={handleResetConfirmed}
          onCancel={() => setConfirmStep(0)}
        />
      )}
    </div>
  );
}
