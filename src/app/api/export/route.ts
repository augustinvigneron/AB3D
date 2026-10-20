import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * GET /api/export — exporte toutes les données de l'utilisateur connecté au format JSON
 * (droit à la portabilité). Seules ses propres lignes sont renvoyées grâce à RLS.
 */
export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [profile, clients, quotes, reminders, events] = await Promise.all([
    supabase.from("profiles").select("full_name, company_name, plan, preferences, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("clients").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("reminders").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("reminder_events").select("*").eq("user_id", user.id).order("created_at"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, ...(profile.data ?? {}) },
    clients: clients.data ?? [],
    devis: quotes.data ?? [],
    relances: reminders.data ?? [],
    historique_relances: events.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="nuvarex-export-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
