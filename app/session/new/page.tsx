import { ContextForm } from "@/components/ContextForm";

/**
 * New-session screen — Feature 1: Setup & Contexte.
 * Collects the consultant brief and client spec before the pitch.
 */
export default function NewSessionPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <p className="wf-eyebrow mb-4">Nouvelle session</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">
        Posez le contexte de votre soutenance
      </h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Donnez au coach les deux documents qui cadrent votre pitch. Il jouera le
        client sceptique et débriefera votre soutenance à partir de ce contexte.
      </p>

      <ContextForm />
    </section>
  );
}
