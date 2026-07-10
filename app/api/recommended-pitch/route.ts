import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/anthropic";
import { getColdContext } from "@/lib/coldContext";
import {
  type AnsweredQuestion,
  type RecommendedPitchResult,
  type RecommendedPitchSection,
  buildRecommendedPitchSystem,
  buildRecommendedPitchUser,
} from "@/lib/prompts";

/**
 * POST /api/recommended-pitch — generate a section-by-section revised pitch
 * grounded in the client's decision criteria, and persist it.
 *
 * Idempotent: returns the stored version if one already exists.
 */

const RECOMMENDED_PITCH_TOOL: Anthropic.Tool = {
  name: "record_recommended_pitch",
  description: "Enregistre le pitch recommandé, section par section.",
  input_schema: {
    type: "object",
    properties: {
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nom de la section." },
            text_original: {
              type: "string",
              description: "Ce que le consultant a dit ('(absent)' si manquant).",
            },
            text_recommande: {
              type: "string",
              description: "Version recommandée, prête à dire à l'oral.",
            },
            changements: {
              type: "array",
              description:
                "1 à 3 changements clés, chacun rattaché à un critère client ou un enjeu.",
              items: { type: "string" },
            },
            pourquoi: {
              type: "string",
              description: "En une phrase, pourquoi c'est plus convaincant.",
            },
          },
          required: [
            "name",
            "text_original",
            "text_recommande",
            "changements",
            "pourquoi",
          ],
          additionalProperties: false,
        },
      },
      full_text: {
        type: "string",
        description: "Le pitch recommandé complet, d'un seul tenant.",
      },
    },
    required: ["sections", "full_text"],
    additionalProperties: false,
  },
};

function cleanSections(value: unknown): RecommendedPitchSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (s): s is RecommendedPitchSection =>
        !!s &&
        typeof (s as RecommendedPitchSection).name === "string" &&
        typeof (s as RecommendedPitchSection).text_recommande === "string",
    )
    .map((s) => ({
      name: s.name.trim(),
      text_original:
        typeof s.text_original === "string" ? s.text_original.trim() : "",
      text_recommande: s.text_recommande.trim(),
      changements: Array.isArray(s.changements)
        ? s.changements
            .filter((c): c is string => typeof c === "string")
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : [],
      pourquoi: typeof s.pourquoi === "string" ? s.pourquoi.trim() : "",
    }));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { session_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  if (!sessionId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id, consultant_brief, client_spec, pitch_transcript, pitch_recommended_json, pitch_recommended_full_text",
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (!session.pitch_transcript) {
    return NextResponse.json({ error: "pitch_missing" }, { status: 409 });
  }

  // Return an existing recommended pitch unchanged.
  if (session.pitch_recommended_json && session.pitch_recommended_full_text) {
    const stored = session.pitch_recommended_json as {
      sections?: RecommendedPitchSection[];
    };
    return NextResponse.json({
      recommended: {
        sections: stored.sections ?? [],
        full_text: session.pitch_recommended_full_text,
      } satisfies RecommendedPitchResult,
    });
  }

  const { data: rows } = await supabase
    .from("questions_generated")
    .select("question_text, question_category, answer_transcript")
    .eq("session_id", sessionId)
    .order("question_order", { ascending: true });

  const qa: AnsweredQuestion[] = (rows ?? []).map((r) => ({
    question_text: r.question_text,
    question_category: r.question_category,
    answer_transcript: r.answer_transcript,
  }));

  let recommended: RecommendedPitchResult;
  try {
    const cold = await getColdContext();
    const raw = await generateStructured<Partial<RecommendedPitchResult>>({
      system: buildRecommendedPitchSystem(cold),
      user: buildRecommendedPitchUser({
        consultantBrief: session.consultant_brief,
        clientSpec: session.client_spec,
        pitchTranscript: session.pitch_transcript,
        qa,
      }),
      tool: RECOMMENDED_PITCH_TOOL,
      maxTokens: 8192,
    });

    recommended = {
      sections: cleanSections(raw.sections),
      full_text: typeof raw.full_text === "string" ? raw.full_text.trim() : "",
    };

    if (recommended.sections.length === 0 && !recommended.full_text) {
      throw new Error("empty_pitch");
    }
  } catch {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      pitch_recommended_json: { sections: recommended.sections },
      pitch_recommended_full_text: recommended.full_text,
    })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ recommended });
}
