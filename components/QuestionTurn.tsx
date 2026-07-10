"use client";

import { MicRecorder } from "@/components/MicRecorder";
import type { QuestionCategory } from "@/lib/prompts";

/**
 * QuestionTurn — a single turn in the turn-based Q&R.
 *
 * Displays the client's question (read aloud by the parent via TTS) and
 * captures the spoken answer. The mic is disabled while the question is being
 * read so the two don't overlap.
 */

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  criteria_check: "Critère de décision",
  transference_test: "Transférabilité",
  objection: "Objection",
};

export interface QAQuestion {
  id: string;
  question_text: string;
  question_category: QuestionCategory;
}

interface QuestionTurnProps {
  question: QAQuestion;
  index: number;
  total: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  speaking: boolean;
  onReplay: () => void;
}

export function QuestionTurn({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  speaking,
  onReplay,
}: QuestionTurnProps) {
  const label = CATEGORY_LABELS[question.question_category] ?? "Question";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="wf-caps text-fg-muted">
          Question {index + 1} / {total}
        </p>
        <span className="rounded-pill bg-glace px-3 py-1 wf-legend text-electrique">
          {label}
        </span>
      </div>

      <div className="rounded-2xl border border-border-white bg-blanc p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <p className="wf-h3 max-w-2xl">{question.question_text}</p>
          <button
            type="button"
            onClick={onReplay}
            className="shrink-0 wf-sm font-medium text-electrique transition-colors hover:text-marine"
          >
            {speaking ? "Lecture…" : "Réécouter"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="wf-caps text-fg-muted">Votre réponse</p>
        <MicRecorder
          value={answer}
          onChange={onAnswerChange}
          disabled={speaking}
          placeholder="Répondez au client, comme en soutenance…"
          rows={8}
        />
      </div>
    </div>
  );
}
