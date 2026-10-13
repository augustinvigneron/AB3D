import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Un nouveau client est créé à chaque requête : ne jamais le partager.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase n'est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans .env.local.",
    );
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : impossible d'écrire des cookies.
          // Le proxy (src/proxy.ts) se charge du rafraîchissement de session.
        }
      },
    },
  });
}

/**
 * Utilisateur courant, vérifié auprès du serveur Supabase (pas seulement le cookie).
 * Mis en cache par requête grâce à React cache().
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
