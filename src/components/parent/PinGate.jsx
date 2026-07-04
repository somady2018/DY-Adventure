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

export function PinGate({ hasPinSet, setupPin, checkPin, onSuccess, onBack }) {
  // 화면에 보여주기 위한 state (점 개수, 단계 제목, 에러)
  const [dotCount, setDotCount] = useState(0);
  const [stageName, setStageName] = useState(
    hasPinSet ? "enter" : "create-step1"
  );
  const [errorMsg, setErrorMsg] = useState("");

  // 실제 로직은 전부 ref로 — 클로저/비동기 문제를 원천 차단
  const stage = useRef(hasPinSet ? "enter" : "create-step1");
  const entered = useRef("");   // 현재 입력 중인 숫자
  const first = useRef("");     // create-step1에서 기억한 PIN
  const busy = useRef(false);   // 중복 처리 방지

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

    // 4자리 완성 — 단계별 처리
    busy.current = true;

    if (stage.current === "create-step1") {
      first.current = next;
      setTimeout(() => {
        reset();
        setStage("create-step2");
        busy.current = false;
      }, 200);

    } else if (stage.current === "create-step2") {
      if (next === first.current) {
        // 일치 → PIN 저장 후 보호자 화면
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
        // 불일치 → 에러 표시 후 처음부터
        setErrorMsg("입력한 번호가 서로 달라요. 다시 설정해주세요.");
        setTimeout(() => {
          first.current = "";
          reset();
          setStage("create-step1");
          busy.current = false;
        }, 1000);
      }

    } else {
      // enter 모드
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
  }

  const titles = {
    "create-step1": "보호자 번호 설정하기",
    "create-step2": "한 번 더 입력해주세요",
    enter: "보호자 화면 잠금",
  };
  const subs = {
    "create-step1": "4자리 숫자를 정해주세요. 보호자 화면에 들어갈 때마다 필요해요.",
    "create-step2": "방금 입력한 번호를 다시 한 번 입력해주세요.",
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
                {k === "back" ? "⌫" : k}
              </button>
            )
          )}
        </div>

        <div className="pin-error-text" role="alert">{errorMsg}</div>
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
