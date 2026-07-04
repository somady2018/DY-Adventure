import { useState } from "react";
import { ConfirmDialog } from "../shared/Shared";

export function ParentDataManager({ exportJson, resetAllData, showToast }) {
  const [confirmStep, setConfirmStep] = useState(0); // 0: 안내, 1: 첫번째 확인, 2: 두번째 확인

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

  function handleResetConfirmed() {
    resetAllData();
    setConfirmStep(0);
    showToast("모든 데이터를 초기화했어요", "success");
  }

  return (
    <div className="fade-slide">
      <div className="parent-card">
        <div className="parent-card-title">📦 데이터 내보내기</div>
        <div className="parent-card-sub" style={{ marginBottom: 10 }}>
          지금까지의 퀘스트, 경험치, 승인 기록, 메시지를 JSON 파일로 저장합니다.
        </div>
        <button type="button" className="modal-btn dark" onClick={handleExport}>JSON 파일로 내보내기</button>
      </div>

      <div className="danger-zone">
        <div className="parent-card-title">⚠️ 전체 데이터 초기화</div>
        <div className="parent-card-sub" style={{ marginBottom: 10, color: "var(--coral-dark)" }}>
          모든 퀘스트 기록, 경험치, 메시지가 영구히 삭제돼요. 되돌릴 수 없으니 내보내기를 먼저 해두는 걸 권장해요.
        </div>
        <button type="button" className="modal-btn danger" onClick={() => setConfirmStep(1)}>모든 데이터 초기화하기</button>
      </div>

      {confirmStep === 1 && (
        <ConfirmDialog
          title="정말 초기화할까요?"
          message="도영이의 모든 퀘스트와 경험치 기록이 사라져요. 계속하려면 한 번 더 확인할게요."
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
