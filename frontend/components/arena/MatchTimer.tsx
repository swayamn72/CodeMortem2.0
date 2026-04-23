"use client";

import { useEffect, useState } from "react";
import styles from "./MatchTimer.module.css";

interface MatchTimerProps {
  remainingSeconds: number;
}

export default function MatchTimer({ remainingSeconds }: MatchTimerProps) {
  const [pulse, setPulse] = useState(false);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60;
  const isDanger = remainingSeconds <= 60;

  useEffect(() => {
    if (isDanger) {
      const interval = setInterval(() => setPulse((p) => !p), 500);
      return () => clearInterval(interval);
    }
  }, [isDanger]);

  return (
    <div
      className={`${styles.timer} ${isWarning ? styles.warning : ""} ${isDanger ? styles.danger : ""} ${pulse ? styles.pulse : ""}`}
    >
      <span className={styles.icon}>⏱</span>
      <span className={styles.time}>{formatted}</span>
    </div>
  );
}
