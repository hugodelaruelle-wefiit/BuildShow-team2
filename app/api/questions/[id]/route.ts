import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/questions/[id] — store the spoken answer to one question.
 *
 * RLS ensures a user can only update questions belonging to their own
 * sessions, so no extra ownership check is needed beyond authentication.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { answer_transcript?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const answerTranscript =
    typeof body.answer_transcript === "string"
      ? body.answer_transcript.trim()
      : "";

  const { data, error } = await supabase
    .from("questions_generated")
    .update({ answer_transcript: answerTranscript })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ id: data.id }, { status: 200 });
}
