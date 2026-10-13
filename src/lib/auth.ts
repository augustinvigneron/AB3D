import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Session = { supabase: SupabaseClient<Database>; user: User };

/**
 * À appeler dans chaque page privée et chaque Server Action :
 * renvoie le client Supabase et l'utilisateur vérifié, ou redirige.
 */
export async function requireUser(): Promise<Session> {
  if (!isSupabaseConfigured()) redirect("/configuration-requise");
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const supabase = await createClient();
  return { supabase, user };
}
