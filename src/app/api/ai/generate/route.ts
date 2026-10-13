import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { aiRequestSchema, zodFieldErrors } from "@/lib/validation/schemas";
import { getAiConfig, generateWithProvider, AiProviderError } from "@/lib/ai/provider";
import { simulateVariants } from "@/lib/ai/simulation";
import { getPlan } from "@/lib/plans";

/**
 * POST /api/ai/generate
 * 1. Vérifie l'utilisateur.
 * 2. Valide l'entrée.
 * 3. Vérifie le quota (lecture) puis génère (IA réelle ou simulation).
 * 4. Consomme le quota de façon atomique (RPC) : si entre-temps il est épuisé, la réponse n'est pas renvoyée.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides.", errors: zodFieldErrors(parsed.error) }, { status: 400 });
  }

  // Pré-vérification du quota (évite d'appeler le fournisseur pour rien).
  const [{ data: profile }, { data: used }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase.rpc("ai_usage_this_month"),
  ]);
  const plan = getPlan(profile?.plan);
  const usedCount = typeof used === "number" ? used : 0;
  if (usedCount >= plan.maxAiGenerationsPerMonth) {
    return NextResponse.json(
      { error: `Quota atteint : ${usedCount}/${plan.maxAiGenerationsPerMonth} générations ce mois-ci sur l'offre ${plan.name}.`, quota: { used: usedCount, limit: plan.maxAiGenerationsPerMonth, plan: plan.id } },
      { status: 429 },
    );
  }

  const cfg = getAiConfig();
  const simulated = cfg === null;
  let variants;
  try {
    variants = simulated ? simulateVariants(parsed.data) : await generateWithProvider(cfg, parsed.data);
  } catch (err) {
    const message = err instanceof AiProviderError ? err.message : "Le service d'IA est momentanément indisponible.";
    return NextResponse.json({ error: `Génération impossible : ${message}. Votre quota n'a pas été décompté.` }, { status: 502 });
  }

  // Consommation atomique du quota (la base verrouille le profil pendant l'opération).
  const { data: consumed, error: rpcError } = await supabase.rpc("consume_ai_generation", { p_simulated: simulated });
  const result = Array.isArray(consumed) ? consumed[0] : consumed;
  if (rpcError || !result) {
    return NextResponse.json({ error: "Impossible de vérifier votre quota. Réessayez." }, { status: 500 });
  }
  if (!result.allowed) {
    return NextResponse.json(
      { error: `Quota atteint : ${result.used}/${result.limit_value} générations ce mois-ci.`, quota: { used: result.used, limit: result.limit_value, plan: result.plan } },
      { status: 429 },
    );
  }

  return NextResponse.json({
    simulated,
    variants,
    quota: { used: result.used, limit: result.limit_value, plan: result.plan },
  });
}
