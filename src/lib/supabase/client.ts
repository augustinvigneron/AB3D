"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "@/lib/database.types";

/** Client Supabase pour les composants navigateur (utilise uniquement la clé publique). */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase n'est pas configuré.");
  return createBrowserClient<Database>(env.url, env.key);
}
