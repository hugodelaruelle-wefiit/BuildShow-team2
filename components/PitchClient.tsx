"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MicRecorder } from "@/components/MicRecorder";
import { PitchTimer } from "@/components/PitchTimer";

/**
 * PitchClient — captures the spoken pitch, then persists it and triggers the
 * skeptical-client question generation before routing to the Q&R.
 */
export function PitchClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pitch, setPitch] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = pitch.trim().length > 0;

  const onRecordingChange = useCallback((r: boolean) => setRecording(r), []);

  async function validate() {
    if (!ready || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          pitch_transcript: pitch.trim(),
        }),
      });

      if (!res.ok) {
        setError(
          res.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "La génération des questions a échoué. Réessayez.",
        );
        setLoading(false);
        return;
      }

      router.push(`/session/${sessionId}/qa`);
    } catch {
      setError("La génération des questions a échoué. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="wf-caps text-fg-muted">Votre pitch</p>
        <PitchTimer running={recording} />
      </div>

      <MicRecorder
        value={pitch}
        onChange={setPitch}
        onRecordingChange={onRecordingChange}
        placeholder="Présentez-vous comme au client : accroche, expériences (méthode STAR), motivations…"
        rows={12}
        disabled={loading}
      />

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-orange/40 bg-orange/5 px-4 py-3 wf-sm text-fg"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={validate}
          disabled={!ready || loading}
          className="inline-flex items-center justify-center rounded-pill bg-electrique px-7 py-3 font-medium text-blanc shadow-md transition-colors hover:bg-marine disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Le client prépare ses questions…" : "Valider mon pitch"}
        </button>
        <span className="wf-legend text-fg-muted">
          Le client sceptique posera ensuite 3 questions, une par une.
        </span>
      </div>
    </div>
  );
}
