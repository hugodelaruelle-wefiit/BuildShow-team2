import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * AppShell — WeFiiT-branded page frame reused by every route.
 * White ground, navy wordmark header, soft navy-tinted hairline, minimal footer.
 * Reads the Supabase session so the header can show the signed-in WeFiiTer.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border-white bg-blanc">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wefiit/logo/wefiit-wordmark-navy.png"
              alt="WeFiiT"
              className="h-7 w-auto"
            />
            <span className="wf-caps text-fg-muted">Coach Soutenances</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/session/new"
              className="wf-sm font-medium text-fg transition-colors hover:text-electrique"
            >
              Nouvelle session
            </Link>
            {email && (
              <>
                <span className="wf-sm text-fg-muted">{email}</span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="wf-sm font-medium text-fg transition-colors hover:text-electrique"
                  >
                    Se déconnecter
                  </button>
                </form>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border-white bg-blanc">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="wf-legend">
            WeFiiT — Entraînement soutenance client
          </span>
          <span className="wf-legend">Prototype V1</span>
        </div>
      </footer>
    </div>
  );
}
