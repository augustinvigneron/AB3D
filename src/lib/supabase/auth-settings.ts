import "server-only";
import { getSupabaseEnv } from "./env";

/**
 * Indique si la connexion Google est activée dans le projet Supabase
 * (Authentication → Sign In / Providers → Google).
 *
 * Interroge l'endpoint public /auth/v1/settings, mis en cache 5 minutes :
 * le bouton « Continuer avec Google » apparaît tout seul une fois Google
 * activé dans Supabase, et reste caché sinon (pas de bouton qui mène à une erreur).
 */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  const env = getSupabaseEnv();
  if (!env) return false;
  try {
    const res = await fetch(`${env.url}/auth/v1/settings`, {
      headers: { apikey: env.key },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { external?: Record<string, unknown> };
    return data.external?.google === true;
  } catch {
    return false;
  }
}
