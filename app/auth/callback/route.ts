import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOMAIN = "wefiit.com";

/**
 * Auth callback — handles both sign-in flows:
 *  - PKCE (`?code=`): OAuth and magic links opened in the same browser.
 *  - Token hash (`?token_hash=&type=`): magic-link / OTP verification.
 *
 * After establishing the session it enforces the WeFiiT tenant policy: any
 * address that is not `@wefiit.com` is signed out and bounced to /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirect = searchParams.get("redirect") ?? "/";

  const loginUrl = new URL("/login", origin);
  const supabase = await createClient();

  let authError: string | null = null;
  let email = "";

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) authError = "exchange_failed";
    else email = data.user?.email?.toLowerCase() ?? "";
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) authError = "verify_failed";
    else email = data.user?.email?.toLowerCase() ?? "";
  } else {
    authError = "missing_code";
  }

  if (authError) {
    loginUrl.searchParams.set("error", authError);
    return NextResponse.redirect(loginUrl);
  }

  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "domain");
    return NextResponse.redirect(loginUrl);
  }

  // Only allow same-origin relative redirects to avoid open-redirects.
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";
  return NextResponse.redirect(new URL(safeRedirect, origin));
}
