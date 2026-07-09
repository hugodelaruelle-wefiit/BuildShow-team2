import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy (Next 16's renamed `middleware`). Runs before every matched route to
 * refresh the Supabase session and redirect unauthenticated users to /login.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico and other static files (svg, png, jpg, woff, css, …)
     * - wefiit/ and fonts/ (public design-system assets)
     * Auth API routes stay matched so the guard covers server actions too;
     * /login and /auth are allow-listed inside updateSession.
     */
    "/((?!_next/static|_next/image|favicon.ico|wefiit|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css)$).*)",
  ],
};
