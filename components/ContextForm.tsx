"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ContextForm — collects the two input documents that ground a session:
 * the consultant brief and the client need specification.
 *
 * On submit it creates the session server-side (POST /api/session) and routes
 * to the pitch screen. "Démarrer" stays disabled until both fields are filled.
 * PDF upload is deferred to V2 — paste as text for now.
 */
export function ContextForm() {
  const router = useRouter();
  const [consultantBrief, setConsultantBrief] = useState("");
  const [clientSpec, setClientSpec] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = consultantBrief.trim().length > 0 && clientSpec.trim().length > 0;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultant_brief: consultantBrief.trim(),
          client_spec: clientSpec.trim(),
        }),
      });

      if (!res.ok) {
        setError(
          res.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "La session n’a pas pu être créée. Réessayez.",
        );
        setLoading(false);
        return;
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/session/${id}/pitch`);
    } catch {
      setError("La session n’a pas pu être créée. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={start} className="mt-10 flex flex-col gap-8">
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-orange/40 bg-orange/5 px-4 py-3 text-sm text-fg"
        >
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="wf-caps text-fg-muted">Brief consultant</span>
          <span className="wf-sm text-fg-muted">
            Le contexte de la mission côté WeFiiT.
          </span>
          <textarea
            required
            rows={12}
            placeholder="Collez le brief consultant : contexte, objectifs, périmètre, contraintes…"
            value={consultantBrief}
            onChange={(e) => setConsultantBrief(e.target.value)}
            className="mt-1 resize-y rounded-2xl border border-border-white bg-blanc px-4 py-3 text-fg outline-none transition-colors focus:border-electrique"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="wf-caps text-fg-muted">
            Spécification besoin client
          </span>
          <span className="wf-sm text-fg-muted">
            Ce que le client attend, dans ses mots.
          </span>
          <textarea
            required
            rows={12}
            placeholder="Collez la spécification du besoin client : attentes, critères de décision, enjeux…"
            value={clientSpec}
            onChange={(e) => setClientSpec(e.target.value)}
            className="mt-1 resize-y rounded-2xl border border-border-white bg-blanc px-4 py-3 text-fg outline-none transition-colors focus:border-electrique"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!ready || loading}
          className="inline-flex items-center justify-center rounded-pill bg-marine px-7 py-3 font-medium text-blanc shadow-md transition-colors hover:bg-marine-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Création…" : "Démarrer"}
        </button>
        <span className="wf-legend text-fg-muted">
          Upload PDF bientôt disponible — collez le texte pour l’instant.
        </span>
      </div>
    </form>
  );
}
