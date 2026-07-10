import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/anthropic";
import { getColdContext } from "@/lib/coldContext";
import {
  type AnsweredQuestion,
  type DebriefResult,
  buildDebriefSystem,
  buildDebriefUser,
} from "@/lib/prompts";

/**
 * POST /api/debrief — generate the Fond / Forme / Storytelling debrief from the
 * full session (cold context + brief + spec + pitch + Q&R), and persist it.
 *
 * Idempotent: if a debrief already exists on the session it is returned as-is
 * rather than regenerated, so revisiting the screen costs no tokens.
 */

const DEBRIEF_TOOL: Anthropic.Tool = {
  name: "record_debrief",
  description: "Enregistre le débrief structuré de la soutenance.",
  input_schema: {
    type: "object",
    properties: {
      strengths: {
        type: "array",
        description: "2 à 3 points forts, une phrase chacun.",
        items: { type: "string" },
      },
      improvements: {
        type: "array",
        description: "2 à 3 axes d'amélioration, une phrase chacun.",
        items: { type: "string" },
      },
      recommendations: {
        type: "array",
        description: "2 à 3 recommandations actionnables, une phrase chacune.",
        items: { type: "string" },
      },
      debrief_full: {
        type: "string",
        description: "Débrief rédigé, structuré par Fond / Forme / Storytelling.",
      },
    },
    required: ["strengths", "improvements", "recommendations", "debrief_full"],
    additionalProperties: false,
  },
};

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 3);
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
      "id, consultant_brief, client_spec, pitch_transcript, feedback_summary, debrief_full",
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (!session.pitch_transcript) {
    return NextResponse.json({ error: "pitch_missing" }, { status: 409 });
  }

  // Return an existing debrief unchanged.
  if (session.debrief_full && session.feedback_summary) {
    const summary = session.feedback_summary as Partial<DebriefResult>;
    return NextResponse.json({
      debrief: {
        strengths: summary.strengths ?? [],
        improvements: summary.improvements ?? [],
        recommendations: summary.recommendations ?? [],
        debrief_full: session.debrief_full,
      } satisfies DebriefResult,
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

  let debrief: DebriefResult;
  try {
    const cold = await getColdContext();
    const raw = await generateStructured<Partial<DebriefResult>>({
      system: buildDebriefSystem(cold),
      user: buildDebriefUser({
        consultantBrief: session.consultant_brief,
        clientSpec: session.client_spec,
        pitchTranscript: session.pitch_transcript,
        qa,
      }),
      tool: DEBRIEF_TOOL,
      maxTokens: 4096,
    });

    debrief = {
      strengths: cleanList(raw.strengths),
      improvements: cleanList(raw.improvements),
      recommendations: cleanList(raw.recommendations),
      debrief_full:
        typeof raw.debrief_full === "string" ? raw.debrief_full.trim() : "",
    };

    if (!debrief.debrief_full) throw new Error("empty_debrief");
  } catch {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      feedback_summary: {
        strengths: debrief.strengths,
        improvements: debrief.improvements,
        recommendations: debrief.recommendations,
      },
      debrief_full: debrief.debrief_full,
    })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ debrief });
}
