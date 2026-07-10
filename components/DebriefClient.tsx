"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebriefCard } from "@/components/DebriefCard";
import { RecommendedPitch } from "@/components/RecommendedPitch";
import type { DebriefResult, RecommendedPitchResult } from "@/lib/prompts";

interface TranscriptQA {
  question_text: string;
  answer_transcript: string | null;
}

/**
 * DebriefClient — orchestrates Feature 3: lazily generates the debrief and the
 * recommended pitch on first visit (each cached server-side afterwards), and
 * lays out the debrief, the read-only transcripts, and the recommended pitch.
 */
export function DebriefClient({
  sessionId,
  initialDebrief,
  initialRecommended,
  pitchTranscript,
  qa,
}: {
  sessionId: string;
  initialDebrief: DebriefResult | null;
  initialRecommended: RecommendedPitchResult | null;
  pitchTranscript: string;
  qa: TranscriptQA[];
}) {
  const [debrief, setDebrief] = useState(initialDebrief);
  const [debriefLoading, setDebriefLoading] = useState(initialDebrief === null);
  const [debriefError, setDebriefError] = useState(false);

  const [recommended, setRecommended] = useState(initialRecommended);
  const [recommendedLoading, setRecommendedLoading] = useState(
    initialRecommended === null,
  );
  const [recommendedError, setRecommendedError] = useState(false);

  const runDebrief = useCallback(async () => {
    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { debrief: DebriefResult };
      setDebrief(data.debrief);
    } catch {
      setDebriefError(true);
    } finally {
      setDebriefLoading(false);
    }
  }, [sessionId]);

  const runRecommended = useCallback(async () => {
    try {
      const res = await fetch("/api/recommended-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { recommended: RecommendedPitchResult };
      setRecommended(data.recommended);
    } catch {
      setRecommendedError(true);
    } finally {
      setRecommendedLoading(false);
    }
  }, [sessionId]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // runDebrief/runRecommended only setState after awaiting the network, so
    // there is no synchronous cascading render — the lint heuristic can't see
    // past the await.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initialDebrief === null) void runDebrief();
    if (initialRecommended === null) void runRecommended();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialDebrief, initialRecommended, runDebrief, runRecommended]);

  function retryDebrief() {
    setDebriefError(false);
    setDebriefLoading(true);
    void runDebrief();
  }
  function retryRecommended() {
    setRecommendedError(false);
    setRecommendedLoading(true);
    void runRecommended();
  }

  return (
    <div className="mt-10 flex flex-col gap-14">
      {/* Débrief */}
      <section className="flex flex-col gap-6">
        <h2 className="wf-h2 wf-dot">Votre débrief</h2>
        {debriefLoading ? (
          <LoadingLine label="Le coach analyse votre soutenance…" />
        ) : debriefError || !debrief ? (
          <ErrorLine label="Le débrief n’a pas pu être généré." onRetry={retryDebrief} />
        ) : (
          <DebriefCard debrief={debrief} />
        )}
      </section>

      {/* Transcripts */}
      <section className="flex flex-col gap-4">
        <h2 className="wf-h2 wf-dot">Vos transcriptions</h2>
        <details className="group rounded-2xl border border-border-white bg-blanc p-6 shadow-sm">
          <summary className="cursor-pointer wf-title text-fg marker:content-['']">
            Pitch
          </summary>
          <p className="mt-4 wf-body whitespace-pre-wrap text-fg-2">
            {pitchTranscript || "(pas de transcription)"}
          </p>
        </details>
        {qa.map((q, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-border-white bg-blanc p-6 shadow-sm"
          >
            <summary className="cursor-pointer wf-title text-fg marker:content-['']">
              Question {i + 1} — {q.question_text}
            </summary>
            <p className="mt-4 wf-body whitespace-pre-wrap text-fg-2">
              {q.answer_transcript?.trim() || "(pas de réponse enregistrée)"}
            </p>
          </details>
        ))}
      </section>

      {/* Pitch recommandé */}
      <section className="flex flex-col gap-6">
        <h2 className="wf-h2 wf-dot">Pitch recommandé</h2>
        {recommendedLoading ? (
          <LoadingLine label="Le coach réécrit votre pitch…" />
        ) : recommendedError || !recommended ? (
          <ErrorLine
            label="Le pitch recommandé n’a pas pu être généré."
            onRetry={retryRecommended}
          />
        ) : (
          <RecommendedPitch recommended={recommended} />
        )}
      </section>
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-white bg-glace px-5 py-4">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 animate-pulse rounded-pill bg-electrique"
      />
      <span className="wf-sm text-fg-muted">{label}</span>
    </div>
  );
}

function ErrorLine({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-orange/40 bg-orange/5 px-5 py-4">
      <span className="wf-sm text-fg">{label}</span>
      <button
        type="button"
        onClick={onRetry}
        className="wf-sm font-medium text-electrique transition-colors hover:text-marine"
      >
        Réessayer
      </button>
    </div>
  );
}
