import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QAClient } from "@/components/QAClient";
import type { QAQuestion } from "@/components/QuestionTurn";

/**
 * Q&R screen — Feature 2, step 4. Runs the skeptical client's 3 questions
 * one at a time. Redirects back to the pitch if no questions exist yet.
 */
export default async function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/session/${id}/qa`);

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: rows } = await supabase
    .from("questions_generated")
    .select("id, question_text, question_category, answer_transcript")
    .eq("session_id", id)
    .order("question_order", { ascending: true });

  if (!rows || rows.length === 0) {
    redirect(`/session/${id}/pitch`);
  }

  const questions: QAQuestion[] = rows.map((r) => ({
    id: r.id,
    question_text: r.question_text,
    question_category: r.question_category,
  }));

  const initialAnswers: Record<string, string> = {};
  for (const r of rows) {
    if (r.answer_transcript) initialAnswers[r.id] = r.answer_transcript;
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="wf-eyebrow mb-4">Étape 2 — Questions du client</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">Le client vous challenge</h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Le client sceptique pose ses trois questions, une par une. Écoutez,
        répondez à voix haute, puis passez à la suivante.
      </p>

      <QAClient
        sessionId={id}
        questions={questions}
        initialAnswers={initialAnswers}
      />
    </section>
  );
}
