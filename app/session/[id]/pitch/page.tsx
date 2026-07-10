import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PitchClient } from "@/components/PitchClient";

/**
 * Pitch screen — Feature 2, step 1. Captures the spoken pitch for a session.
 * Verifies the signed-in WeFiiTer owns the session before rendering.
 */
export default async function PitchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/session/${id}/pitch`);

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (!session) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="wf-eyebrow mb-4">Étape 1 — Pitch</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">Pitchez à voix haute</h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Lancez le micro et déroulez votre soutenance comme devant le client.
        Votre pitch s’affiche en direct — relisez-le, corrigez si besoin, puis
        validez pour passer aux questions.
      </p>

      <PitchClient sessionId={id} />
    </section>
  );
}
