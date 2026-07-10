import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Sessions history — Phase 5.2. Lets a WeFiiTer find and resume any of their
 * persisted sessions (DoD #6). Each row deep-links to the right step based on
 * how far the session got: pitch → Q&R → débrief.
 */
export default async function SessionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/sessions");

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, created_at, consultant_brief, client_spec, pitch_transcript, debrief_full",
    )
    .order("created_at", { ascending: false });

  const rows = sessions ?? [];

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="wf-eyebrow mb-4">Historique</p>
      <h1 className="wf-h1 wf-dot max-w-3xl">Vos sessions</h1>
      <p className="wf-lead mt-6 max-w-2xl">
        Reprenez une soutenance là où vous l’avez laissée, ou relisez un débrief
        déjà généré.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border-white bg-glace px-6 py-8 text-center">
            <p className="wf-body text-fg">
              Vous n’avez pas encore de session.
            </p>
            <Link
              href="/session/new"
              className="mt-6 inline-flex items-center justify-center rounded-pill bg-marine px-7 py-3 font-medium text-blanc shadow-md transition-colors hover:bg-marine-900"
            >
              Démarrer une session
            </Link>
          </div>
        ) : (
          rows.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </div>
    </section>
  );
}

interface SessionSummary {
  id: string;
  created_at: string;
  consultant_brief: string;
  client_spec: string;
  pitch_transcript: string | null;
  debrief_full: string | null;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

function firstLine(text: string, max = 90): string {
  const line = text.trim().split("\n")[0]?.trim() ?? "";
  if (line.length <= max) return line;
  return line.slice(0, max).trimEnd() + "…";
}

function SessionRow({ session: s }: { session: SessionSummary }) {
  const { href, cta, status } = resumeTarget(s);
  const title = firstLine(s.client_spec) || firstLine(s.consultant_brief) || "Session";

  return (
    <Link
      href={href}
      className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-white bg-blanc px-6 py-5 shadow-sm transition-colors hover:border-electrique"
    >
      <div className="min-w-0 flex-1">
        <p className="wf-title truncate text-fg">{title}</p>
        <p className="mt-1 wf-legend text-fg-muted">
          {dateFmt.format(new Date(s.created_at))}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`rounded-pill px-3 py-1 wf-legend ${status.className}`}>
          {status.label}
        </span>
        <span className="wf-sm font-medium text-electrique transition-colors group-hover:text-marine">
          {cta}
        </span>
      </div>
    </Link>
  );
}

/** Deep-link + labels derived from how far the session progressed. */
function resumeTarget(s: SessionSummary): {
  href: string;
  cta: string;
  status: { label: string; className: string };
} {
  if (s.debrief_full) {
    return {
      href: `/session/${s.id}/debrief`,
      cta: "Voir le débrief",
      status: { label: "Débrief prêt", className: "bg-jade/15 text-marine" },
    };
  }
  if (s.pitch_transcript) {
    return {
      href: `/session/${s.id}/qa`,
      cta: "Reprendre",
      status: { label: "En cours", className: "bg-orange/15 text-marine" },
    };
  }
  return {
    href: `/session/${s.id}/pitch`,
    cta: "Reprendre",
    status: { label: "À démarrer", className: "bg-glace text-fg-muted" },
  };
}
