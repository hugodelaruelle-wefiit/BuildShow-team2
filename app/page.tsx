import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <p className="wf-eyebrow mb-4">Entraînement soutenance</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">
        Pitchez sans complexes avant votre prépa avec le PAD
      </h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Un coach IA joue le client sceptique, écoute votre pitch à voix haute,
        pose ses questions et débriefe le fond, la forme et le storytelling.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/session/new"
          className="inline-flex items-center justify-center rounded-pill bg-marine px-7 py-3 text-blanc font-medium shadow-md transition-colors hover:bg-marine-900"
        >
          Démarrer une session
        </Link>
        <Link
          href="/session/new"
          className="inline-flex items-center justify-center rounded-pill border border-border-white px-7 py-3 text-fg font-medium transition-colors hover:text-electrique"
        >
          En savoir plus
        </Link>
      </div>
    </section>
  );
}
