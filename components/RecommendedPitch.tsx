"use client";

import { useState } from "react";
import type { RecommendedPitchResult } from "@/lib/prompts";

/**
 * RecommendedPitch — the revised pitch, section by section, with the "ready to
 * rehearse" full text. Offers copy-to-clipboard and a Markdown download.
 */

function buildMarkdown(recommended: RecommendedPitchResult): string {
  const lines: string[] = ["# Pitch recommandé", "", recommended.full_text, ""];
  if (recommended.sections.length > 0) {
    lines.push("---", "", "## Détail des changements", "");
    for (const s of recommended.sections) {
      lines.push(`### ${s.name}`, "", s.text_recommande, "");
      if (s.changements.length > 0) {
        lines.push("**Changements :**");
        for (const c of s.changements) lines.push(`- ${c}`);
        lines.push("");
      }
      if (s.pourquoi) lines.push(`_Pourquoi : ${s.pourquoi}_`, "");
    }
  }
  return lines.join("\n");
}

export function RecommendedPitch({
  recommended,
}: {
  recommended: RecommendedPitchResult;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        recommended.full_text || buildMarkdown(recommended),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([buildMarkdown(recommended)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pitch-recommande.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center rounded-pill bg-marine px-6 py-2.5 wf-sm font-medium text-blanc shadow-md transition-colors hover:bg-marine-900"
        >
          {copied ? "Copié" : "Copier le pitch"}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center justify-center rounded-pill border border-border-white px-6 py-2.5 wf-sm font-medium text-fg transition-colors hover:text-electrique"
        >
          Télécharger (.md)
        </button>
      </div>

      {recommended.sections.length > 0 && (
        <div className="flex flex-col gap-5">
          {recommended.sections.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-white bg-blanc p-6 shadow-sm"
            >
              <p className="wf-title">{s.name}</p>

              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                {s.text_original && (
                  <div>
                    <p className="wf-caps mb-2 text-fg-muted">Version actuelle</p>
                    <p className="wf-sm whitespace-pre-wrap text-fg-muted">
                      {s.text_original}
                    </p>
                  </div>
                )}
                <div>
                  <p className="wf-caps mb-2 text-electrique">Version recommandée</p>
                  <p className="wf-body whitespace-pre-wrap text-fg-2">
                    {s.text_recommande}
                  </p>
                </div>
              </div>

              {s.changements.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {s.changements.map((c, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 wf-sm text-fg-2"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-orange"
                      />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.pourquoi && (
                <p className="mt-4 wf-legend italic text-fg-muted">
                  Pourquoi : {s.pourquoi}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {recommended.full_text && (
        <div className="rounded-2xl border border-border-white bg-glace p-6">
          <p className="wf-caps mb-3 text-fg-muted">Pitch complet à répéter</p>
          <p className="wf-body whitespace-pre-wrap text-fg-2">
            {recommended.full_text}
          </p>
        </div>
      )}
    </div>
  );
}
