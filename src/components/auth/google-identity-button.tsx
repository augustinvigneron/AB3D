"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* Types minimaux de Google Identity Services (https://accounts.google.com/gsi/client). */
type CredentialResponse = { credential: string };
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (res: CredentialResponse) => void;
    nonce?: string;
    use_fedcm_for_prompt?: boolean;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (
    el: HTMLElement,
    options: { type?: "standard"; theme?: "outline" | "filled_blue" | "filled_black"; size?: "large"; text?: "continue_with"; shape?: "rectangular" | "pill"; locale?: string; width?: number; logo_alignment?: "left" | "center" },
  ) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Bouton officiel « Continuer avec Google » (Google Identity Services).
 *
 * Contrairement à la redirection OAuth classique, Google affiche l'adresse du
 * site (et, après vérification de la marque par Google, son nom et son logo)
 * au lieu de l'adresse technique de Supabase.
 *
 * Flux : Google renvoie un jeton d'identité signé → Supabase le vérifie
 * (signInWithIdToken) et ouvre la session. Un nonce empêche la réutilisation
 * d'un jeton intercepté.
 */
export function GoogleIdentityButton({ clientId, next = "/dashboard" }: { clientId: string; next?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptReady || !window.google || !container.current) return;
    let cancelled = false;

    (async () => {
      const rawNonce = randomNonce();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled || !window.google || !container.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        ux_mode: "popup",
        callback: async ({ credential }) => {
          setBusy(true);
          setError(null);
          const supabase = createClient();
          const { error: authError } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce: rawNonce });
          if (authError) {
            setBusy(false);
            setError("La connexion avec Google n'a pas abouti. Réessayez, ou utilisez votre email.");
            return;
          }
          // Navigation complète : le serveur relit la session depuis les cookies.
          window.location.assign(next);
        },
      });

      const width = Math.min(400, Math.max(200, Math.floor(container.current.offsetWidth)));
      window.google.accounts.id.renderButton(container.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        locale: "fr",
        logo_alignment: "center",
        width,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptReady, clientId, next]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div className="relative">
        <div ref={container} className="flex min-h-10 w-full justify-center" aria-label="Continuer avec Google" />
        {(busy || !scriptReady) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface/80">
            <Loader2 className="size-4 animate-spin text-fg-muted" aria-hidden />
            <span className="sr-only">{busy ? "Connexion en cours" : "Chargement du bouton Google"}</span>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}
      <div className="my-5 flex items-center gap-3 text-xs text-fg-subtle" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        ou avec votre email
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
