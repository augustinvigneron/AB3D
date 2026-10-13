/**
 * Lecture des variables d'environnement Supabase.
 * Ces deux valeurs sont publiques par conception (préfixe NEXT_PUBLIC_) :
 * la sécurité des données repose sur les politiques RLS côté base.
 * Aucune clé "service_role" n'est jamais utilisée dans ce projet.
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
