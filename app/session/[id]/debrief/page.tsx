import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DebriefClient } from "@/components/DebriefClient";
import type { DebriefResult, RecommendedPitchResult } from "@/lib/prompts";

/**
 * Debrief screen — Feature 3. Shows the coach's feedback, the read-only
 * transcripts, and the recommended pitch. Generation is triggered client-side
 * on first visit and cached server-side thereafter.
 */
export default async function DebriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/session/${id}/debrief`);

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, pitch_transcript, feedback_summary, debrief_full, pitch_recommended_json, pitch_recommended_full_text",
    )
    .eq("id", id)
    .single();

  if (!session) notFound();
  if (!session.pitch_transcript) redirect(`/session/${id}/pitch`);

  const { data: rows } = await supabase
    .from("questions_generated")
    .select("question_text, answer_transcript")
    .eq("session_id", id)
    .order("question_order", { ascending: true });

  if (!rows || rows.length === 0) redirect(`/session/${id}/pitch`);

  const summary = session.feedback_summary as Partial<DebriefResult> | null;
  const initialDebrief: DebriefResult | null =
    summary && session.debrief_full
      ? {
          strengths: summary.strengths ?? [],
          improvements: summary.improvements ?? [],
          recommendations: summary.recommendations ?? [],
          debrief_full: session.debrief_full,
        }
      : null;

  const storedPitch = session.pitch_recommended_json as {
    sections?: RecommendedPitchResult["sections"];
  } | null;
  const initialRecommended: RecommendedPitchResult | null =
    storedPitch && session.pitch_recommended_full_text
      ? {
          sections: storedPitch.sections ?? [],
          full_text: session.pitch_recommended_full_text,
        }
      : null;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="wf-eyebrow mb-4">Étape 3 — Débrief</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">Votre soutenance, décortiquée</h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Le coach évalue votre soutenance sur le fond, la forme et le
        storytelling, puis vous propose un pitch recommandé, section par section.
      </p>

      <DebriefClient
        sessionId={id}
        initialDebrief={initialDebrief}
        initialRecommended={initialRecommended}
        pitchTranscript={session.pitch_transcript}
        qa={rows}
      />
    </section>
  );
}
