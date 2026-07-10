import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { getColdContext } from "@/lib/coldContext";
import {
  QUESTION_CATEGORIES,
  type QuestionCategory,
  buildQuestionsSystem,
  buildQuestionsUser,
} from "@/lib/prompts";

/**
 * POST /api/questions — persist the pitch, then generate the skeptical
 * client's 3 questions from the cold context + brief + spec + pitch.
 *
 * Runs entirely server-side so the Claude key stays hidden. Structured output
 * comes back via a forced tool call, then the questions are stored (replacing
 * any prior set for the session, so re-validating a pitch is idempotent).
 */

interface GeneratedQuestion {
  question_text: string;
  question_category: QuestionCategory;
}

const QUESTIONS_TOOL = {
  name: "record_questions",
  description: "Enregistre les 3 questions du client sceptique.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question_text: {
              type: "string",
              description: "La question, telle que le client la poserait.",
            },
            question_category: {
              type: "string",
              enum: [...QUESTION_CATEGORIES],
            },
          },
          required: ["question_text", "question_category"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  },
};

function isValidCategory(value: unknown): value is QuestionCategory {
  return (
    typeof value === "string" &&
    (QUESTION_CATEGORIES as readonly string[]).includes(value)
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { session_id?: unknown; pitch_transcript?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  const pitchTranscript =
    typeof body.pitch_transcript === "string" ? body.pitch_transcript.trim() : "";

  if (!sessionId || !pitchTranscript) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Load the session (RLS scopes this to the signed-in user).
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, consultant_brief, client_spec")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  // Persist the pitch on the session.
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ pitch_transcript: pitchTranscript })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Generate the questions with Claude (structured output via forced tool use).
  let questions: GeneratedQuestion[];
  try {
    const cold = await getColdContext();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      thinking: { type: "disabled" },
      system: buildQuestionsSystem(cold),
      tools: [QUESTIONS_TOOL],
      tool_choice: { type: "tool", name: "record_questions" },
      messages: [
        {
          role: "user",
          content: buildQuestionsUser({
            consultantBrief: session.consultant_brief,
            clientSpec: session.client_spec,
            pitchTranscript,
          }),
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "record_questions",
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("no_tool_use");
    }

    const raw = (toolUse.input as { questions?: unknown }).questions;
    if (!Array.isArray(raw)) throw new Error("invalid_tool_output");

    questions = raw
      .filter(
        (q): q is GeneratedQuestion =>
          !!q &&
          typeof (q as GeneratedQuestion).question_text === "string" &&
          isValidCategory((q as GeneratedQuestion).question_category),
      )
      .map((q) => ({
        question_text: q.question_text.trim(),
        question_category: q.question_category,
      }))
      .filter((q) => q.question_text.length > 0)
      .slice(0, 3);

    if (questions.length === 0) throw new Error("no_questions");
  } catch {
    return NextResponse.json(
      { error: "generation_failed" },
      { status: 502 },
    );
  }

  // Replace any prior questions for this session, then insert the new set.
  await supabase.from("questions_generated").delete().eq("session_id", sessionId);

  const { data: inserted, error: insertError } = await supabase
    .from("questions_generated")
    .insert(
      questions.map((q, i) => ({
        session_id: sessionId,
        question_order: i,
        question_text: q.question_text,
        question_category: q.question_category,
      })),
    )
    .select("id, question_order, question_text, question_category");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ questions: inserted }, { status: 201 });
}
