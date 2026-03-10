import { useState, useEffect, useCallback } from "react";

const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

export function useExpiryTimer(active: boolean) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  // Start timer when active becomes true
  useEffect(() => {
    if (active) {
      setExpiresAt(Date.now() + EXPIRY_DURATION);
      setExpired(false);
    } else {
      setExpiresAt(null);
      setExpired(false);
      setSecondsLeft(0);
    }
  }, [active]);

  // Tick every second
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const reset = useCallback(() => {
    setExpiresAt(Date.now() + EXPIRY_DURATION);
    setExpired(false);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { secondsLeft, formatted, expired, reset };
}
