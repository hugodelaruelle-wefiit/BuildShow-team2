"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PitchTimer — elapsed-time counter for the pitch.
 *
 * Counts up while `running`, pauses otherwise (accumulating across pauses).
 * A soutenance targets ~10 min, so the readout turns to the warning color
 * once that mark is passed.
 */

const TARGET_SECONDS = 10 * 60;

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PitchTimer({ running }: { running: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      return;
    }
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const prev = lastTickRef.current ?? now;
      lastTickRef.current = now;
      setElapsed((e) => e + Math.round((now - prev) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const overTarget = elapsed > TARGET_SECONDS;

  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`font-sans text-3xl font-medium tabular-nums ${
          overTarget ? "text-avertissement" : "text-fg"
        }`}
      >
        {format(elapsed)}
      </span>
      <span className="wf-legend text-fg-muted">Repère : 10:00</span>
    </div>
  );
}
