import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/session — create a coaching session from the context form.
 *
 * Persists the two input documents (consultant brief + client spec) against the
 * signed-in WeFiiTer and returns the new session id so the client can route to
 * the pitch screen. The Claude key never touches this route; only Supabase.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { consultant_brief?: unknown; client_spec?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const consultantBrief =
    typeof body.consultant_brief === "string" ? body.consultant_brief.trim() : "";
  const clientSpec =
    typeof body.client_spec === "string" ? body.client_spec.trim() : "";

  if (!consultantBrief || !clientSpec) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      consultant_brief: consultantBrief,
      client_spec: clientSpec,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
