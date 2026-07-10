"use client";

import { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

/**
 * MicRecorder — voice capture with a live, editable transcript.
 *
 * Reused by the pitch screen and each Q&R turn. Final speech segments are
 * appended to `value`; the caller owns the text so it stays editable before
 * validation (fr-FR transcription is imperfect). Falls back to a plain
 * textarea with a warning when the browser lacks the Web Speech API.
 */

interface MicRecorderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Disable capture + editing (e.g. while the client is speaking). */
  disabled?: boolean;
  /** Notifies the parent when recording starts/stops (to drive a timer). */
  onRecordingChange?: (recording: boolean) => void;
  rows?: number;
}

function appendChunk(current: string, chunk: string): string {
  const clean = chunk.trim();
  if (!clean) return current;
  if (!current) return clean;
  const sep = /\s$/.test(current) ? "" : " ";
  return current + sep + clean;
}

export function MicRecorder({
  value,
  onChange,
  placeholder,
  disabled = false,
  onRecordingChange,
  rows = 8,
}: MicRecorderProps) {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const { supported, listening, interim, error, start, stop } =
    useSpeechRecognition({
      onFinalResult: (chunk) => onChange(appendChunk(valueRef.current, chunk)),
    });

  useEffect(() => {
    onRecordingChange?.(listening);
  }, [listening, onRecordingChange]);

  // Stop capture if the recorder is disabled mid-recording.
  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  function toggle() {
    if (listening) stop();
    else start();
  }

  return (
    <div className="flex flex-col gap-4">
      {supported ? (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-pressed={listening}
            className={`inline-flex items-center gap-2 rounded-pill px-6 py-3 font-medium shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              listening
                ? "bg-orange text-blanc hover:bg-orange-600"
                : "bg-marine text-blanc hover:bg-marine-900"
            }`}
          >
            <span
              aria-hidden
              className={`inline-block h-2.5 w-2.5 rounded-pill ${
                listening ? "animate-pulse bg-blanc" : "bg-blanc/80"
              }`}
            />
            {listening ? "Arrêter" : "Démarrer le micro"}
          </button>
          <span className="wf-sm text-fg-muted" aria-live="polite">
            {listening
              ? interim
                ? `« ${interim} »`
                : "À l’écoute…"
              : "Cliquez pour dicter, puis relisez et corrigez si besoin."}
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-white bg-glace px-4 py-3">
          <p className="wf-sm text-fg">
            La dictée vocale n’est pas disponible sur ce navigateur. Saisissez ou
            collez votre texte ci-dessous — vous pouvez le préparer à l’avance.
          </p>
          <p className="mt-1 wf-legend text-fg-muted">
            Pour dicter à la voix, ouvrez l’application dans Chrome, Edge ou
            Safari.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="wf-sm text-alerte">
          {error}
        </p>
      )}

      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-y rounded-2xl border border-border-white bg-blanc px-4 py-3 text-fg outline-none transition-colors focus:border-electrique disabled:opacity-60"
      />
    </div>
  );
}
