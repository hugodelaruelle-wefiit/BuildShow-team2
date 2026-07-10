"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { QuestionTurn, type QAQuestion } from "@/components/QuestionTurn";

/**
 * QAClient — drives the turn-based Q&R: reads each question aloud, captures the
 * spoken answer, persists it, and advances to the next until the debrief.
 */
export function QAClient({
  sessionId,
  questions,
  initialAnswers,
}: {
  sessionId: string;
  questions: QAQuestion[];
  initialAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const { speak, cancel, speaking } = useSpeechSynthesis();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[index];
  const isLast = index === questions.length - 1;

  // Read the current question aloud whenever the turn changes.
  const spokenForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!current) return;
    if (spokenForRef.current === current.id) return;
    spokenForRef.current = current.id;
    speak(current.question_text);
    return () => cancel();
  }, [current, speak, cancel]);

  if (!current) return null;

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  async function saveAnswer(): Promise<boolean> {
    const res = await fetch(`/api/questions/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_transcript: answers[current.id] ?? "" }),
    });
    return res.ok;
  }

  async function next() {
    if (saving) return;
    cancel();
    setSaving(true);
    setError(null);

    const ok = await saveAnswer();
    if (!ok) {
      setError("La réponse n’a pas pu être enregistrée. Réessayez.");
      setSaving(false);
      return;
    }

    if (isLast) {
      router.push(`/session/${sessionId}/debrief`);
      return;
    }

    setIndex((i) => i + 1);
    setSaving(false);
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      {/* Progress dots */}
      <div className="flex items-center gap-2" aria-hidden>
        {questions.map((q, i) => (
          <span
            key={q.id}
            className={`h-1.5 w-10 rounded-pill transition-colors ${
              i < index
                ? "bg-electrique"
                : i === index
                  ? "bg-marine"
                  : "bg-border-white"
            }`}
          />
        ))}
      </div>

      <QuestionTurn
        question={current}
        index={index}
        total={questions.length}
        answer={answers[current.id] ?? ""}
        onAnswerChange={setAnswer}
        speaking={speaking}
        onReplay={() => speak(current.question_text)}
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
          onClick={next}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-pill bg-marine px-7 py-3 font-medium text-blanc shadow-md transition-colors hover:bg-marine-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Enregistrement…"
            : isLast
              ? "Voir mon débrief"
              : "Question suivante"}
        </button>
        <span className="wf-legend text-fg-muted">
          Répondez à voix haute, puis passez à la suite.
        </span>
      </div>
    </div>
  );
}
