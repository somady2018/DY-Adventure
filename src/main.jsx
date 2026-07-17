import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/screens.css";
import App from "./App.jsx";
import { restoreFromNativeStorage } from "./storage/nativeMirror";

// 네이티브 앱에서는 localStorage가 비어 있을 때(OS가 지웠거나 최초 실행)
// 네이티브 저장소에서 데이터를 복원한 뒤에 렌더링을 시작해야 합니다.
// 웹에서는 즉시 resolve되는 no-op입니다.
restoreFromNativeStorage().finally(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
