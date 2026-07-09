"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_DOMAIN = "wefiit.com";

/**
 * Login screen — magic-link fallback (Supabase email OTP).
 *
 * Temporary while Azure SSO is being set up: a WeFiiTer enters their
 * `@wefiit.com` address and receives a one-time sign-in link by email.
 * The domain is enforced here and again server-side in the callback.
 */
function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const redirect = searchParams.get("redirect") ?? "/";

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError("Utilisez votre adresse @wefiit.com.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("redirect", redirect);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  const banner =
    errorParam === "domain"
      ? "Accès réservé aux adresses @wefiit.com."
      : errorParam
        ? "Le lien est invalide ou expiré. Redemandez-en un."
        : error;

  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-6 py-20 sm:py-28">
      <p className="wf-eyebrow mb-4">Espace WeFiiT</p>
      <h1 className="wf-h2 wf-dot">Connectez-vous</h1>
      <p className="wf-lead mt-4">
        Accès réservé aux WeFiiTers. Recevez un lien de connexion par e-mail.
      </p>

      {banner && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-orange/40 bg-orange/5 px-4 py-3 text-sm text-fg"
        >
          {banner}
        </p>
      )}

      {sent ? (
        <div className="mt-8 rounded-2xl border border-jade/40 bg-jade/5 px-5 py-4">
          <p className="wf-sm font-medium text-fg">Lien envoyé.</p>
          <p className="wf-sm mt-1 text-fg-muted">
            Ouvrez l’e-mail envoyé à <strong>{email.trim().toLowerCase()}</strong>{" "}
            et cliquez sur le lien pour vous connecter. Pensez aux spams.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="wf-sm mt-3 font-medium text-electrique transition-colors hover:underline"
          >
            Utiliser une autre adresse
          </button>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="wf-caps text-fg-muted">Adresse e-mail WeFiiT</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="prenom.nom@wefiit.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-border-white bg-blanc px-4 py-3 text-fg outline-none transition-colors focus:border-electrique"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-pill bg-marine px-7 py-3 font-medium text-blanc shadow-md transition-colors hover:bg-marine-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Recevoir le lien de connexion"}
          </button>
        </form>
      )}

      <p className="wf-legend mt-6 text-fg-muted">
        Connexion Microsoft 365 bientôt disponible.
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
