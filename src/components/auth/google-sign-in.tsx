import { GoogleButton } from "./google-button";
import { GoogleIdentityButton } from "./google-identity-button";

/**
 * Choisit le bouton Google à afficher :
 * - NEXT_PUBLIC_GOOGLE_CLIENT_ID défini → bouton officiel Google (affiche l'adresse du site) ;
 * - sinon → redirection OAuth classique via Supabase (affiche l'adresse supabase.co).
 * Rien n'est affiché si Google n'est pas activé dans Supabase.
 */
export function GoogleSignIn({ enabled, next = "/dashboard" }: { enabled: boolean; next?: string }) {
  if (!enabled) return null;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return clientId ? <GoogleIdentityButton clientId={clientId} next={next} /> : <GoogleButton next={next} />;
}
