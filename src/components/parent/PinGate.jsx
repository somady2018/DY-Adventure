import { useState, useRef } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

function PinDots({ count }) {
  return (
    <div className="pin-dots" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`pin-dot ${i < count ? "filled" : ""}`} />
      ))}
    </div>
  );
}

export function PinGate({ hasPinSet, setupPin, checkPin, resetPin, onSuccess, onBack }) {
  const [dotCount, setDotCount] = useState(0);
  const [stageName, setStageName] = useState(hasPinSet ? "enter" : "create-step1");
  const [errorMsg, setErrorMsg] = useState("");
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);

  const stage = useRef(hasPinSet ? "enter" : "create-step1");
  const entered = useRef("");
  const first = useRef("");
  const busy = useRef(false);

  function setDisplay(val) {
    entered.current = val;
    setDotCount(val.length);
  }

  function setStage(s) {
    stage.current = s;
    setStageName(s);
  }

  function reset() {
    setDisplay("");
    setErrorMsg("");
  }

  function startPinRecovery() {
    resetPin?.();
    first.current = "";
    reset();
    setShowRecoveryConfirm(false);
    setStage("create-step1");
  }

  async function handleKey(k) {
    if (busy.current) return;

    if (k === "back") {
      setDisplay(entered.current.slice(0, -1));
      setErrorMsg("");
      return;
    }

    if (entered.current.length >= 4) return;

    const next = entered.current + k;
    setDisplay(next);

    if (next.length < 4) return;

    busy.current = true;

    if (stage.current === "create-step1") {
      first.current = next;
      setTimeout(() => {
        reset();
        setStage("create-step2");
        busy.current = false;
      }, 200);
      return;
    }

    if (stage.current === "create-step2") {
      if (next === first.current) {
        try {
          await setupPin(next);
          busy.current = false;
          onSuccess();
        } catch (err) {
          console.error("PIN setup failed", err);
          setErrorMsg("PIN 저장에 실패했어요. 다시 한 번 입력해 주세요.");
          setTimeout(() => {
            first.current = "";
            reset();
            setStage("create-step1");
            busy.current = false;
          }, 1000);
        }
      } else {
        setErrorMsg("입력한 번호가 서로 달라요. 다시 설정해 주세요.");
        setTimeout(() => {
          first.current = "";
          reset();
          setStage("create-step1");
          busy.current = false;
        }, 1000);
      }
      return;
    }

    try {
      const ok = await checkPin(next);
      if (ok) {
        busy.current = false;
        onSuccess();
      } else {
        setErrorMsg("번호가 올바르지 않아요.");
        setTimeout(() => {
          reset();
          busy.current = false;
        }, 600);
      }
    } catch (err) {
      console.error("PIN check failed", err);
      setErrorMsg("PIN 확인에 실패했어요. 다시 입력해 주세요.");
      setTimeout(() => {
        reset();
        busy.current = false;
      }, 600);
    }
  }

  const titles = {
    "create-step1": "보호자 번호 설정하기",
    "create-step2": "한 번 더 입력해 주세요",
    enter: "보호자 화면 잠금",
  };
  const subs = {
    "create-step1": "4자리 숫자를 정해 주세요. 보호자 화면에 들어갈 때마다 필요해요.",
    "create-step2": "방금 입력한 번호를 다시 한 번 입력해 주세요.",
    enter: "4자리 번호를 입력하면 보호자 화면으로 들어갈 수 있어요.",
  };

  return (
    <div className="screen">
      <div className="pin-screen">
        <div className="pin-lock-ico" aria-hidden="true">🔒</div>
        <div className="pin-title">{titles[stageName]}</div>
        <div className="pin-sub">{subs[stageName]}</div>
        <PinDots count={dotCount} />

        <div className="pin-keypad">
          {KEYS.map((k, i) =>
            k === "" ? (
              <button
                key={i}
                type="button"
                className="pin-key empty"
                tabIndex={-1}
                aria-hidden="true"
              />
            ) : (
              <button
                key={i}
                type="button"
                className="pin-key"
                onClick={() => handleKey(k)}
                aria-label={k === "back" ? "지우기" : `숫자 ${k}`}
              >
                {k === "back" ? "←" : k}
              </button>
            )
          )}
        </div>

        <div className="pin-error-text" role="alert">{errorMsg}</div>

        {stageName === "enter" && !showRecoveryConfirm && (
          <button
            type="button"
            className="text-link-btn"
            style={{ marginTop: 14 }}
            onClick={() => setShowRecoveryConfirm(true)}
          >
            백업 복원 후 PIN이 안 맞나요?
          </button>
        )}

        {stageName === "enter" && showRecoveryConfirm && (
          <div className="pin-recovery-card">
            <div className="pin-recovery-title">보호자 PIN을 다시 설정할까요?</div>
            <div className="pin-recovery-text">
              퀘스트와 경험치 기록은 그대로 두고 보호자 화면 잠금 번호만 새로 만들어요.
            </div>
            <button type="button" className="modal-btn dark" onClick={startPinRecovery}>
              새 PIN 만들기
            </button>
            <button
              type="button"
              className="modal-btn ghost"
              onClick={() => setShowRecoveryConfirm(false)}
            >
              취소
            </button>
          </div>
        )}

        <button
          type="button"
          className="text-link-btn"
          style={{ marginTop: 18 }}
          onClick={onBack}
        >
          아이 화면으로 돌아가기
        </button>
      </div>
    </div>
  );
}
