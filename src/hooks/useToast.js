import { useState, useCallback, useRef } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, tone = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, tone, key: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return { toast, showToast };
}
