import type { DebriefResult } from "@/lib/prompts";

/**
 * DebriefCard — renders the coach's feedback: strengths, areas to work on,
 * recommendations, and the full Fond / Forme / Storytelling write-up.
 * Uses colored dots as markers (no emoji, per the WeFiiT brand).
 */

function MarkerList({
  title,
  items,
  dotClass,
}: {
  title: string;
  items: string[];
  dotClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="wf-caps text-fg-muted">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 wf-body text-fg-2">
            <span
              aria-hidden
              className={`mt-2 inline-block h-2 w-2 shrink-0 rounded-pill ${dotClass}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DebriefCard({ debrief }: { debrief: DebriefResult }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-3">
        <MarkerList
          title="Points forts"
          items={debrief.strengths}
          dotClass="bg-jade"
        />
        <MarkerList
          title="À travailler"
          items={debrief.improvements}
          dotClass="bg-avertissement"
        />
        <MarkerList
          title="Recommandations"
          items={debrief.recommendations}
          dotClass="bg-electrique"
        />
      </div>

      {debrief.debrief_full && (
        <div className="rounded-2xl border border-border-white bg-blanc p-6 shadow-sm">
          <p className="wf-caps mb-4 text-fg-muted">Débrief détaillé</p>
          <p className="wf-body whitespace-pre-wrap text-fg-2">
            {debrief.debrief_full}
          </p>
        </div>
      )}
    </div>
  );
}
