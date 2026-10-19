import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { aiRequestSchema, zodFieldErrors } from "@/lib/validation/schemas";
import { getAiConfig, generateWithProvider, AiProviderError } from "@/lib/ai/provider";
import { writeFromTemplates } from "@/lib/ai/templates";
import { getPlan } from "@/lib/plans";

/**
 * POST /api/ai/generate
 * 1. Vérifie l'utilisateur.
 * 2. Valide l'entrée.
 * 3. Sans clé d'IA : rédaction par modèles (gratuite, illimitée, sans appel externe) → réponse immédiate.
 * 4. Avec clé d'IA : vérifie le quota, appelle le fournisseur, puis consomme le quota
 *    de façon atomique (RPC) ; si entre-temps il est épuisé, la réponse n'est pas renvoyée.
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

  const cfg = getAiConfig();

  // Rédaction par modèles : aucun coût, aucune donnée envoyée à l'extérieur, donc pas de quota.
  if (cfg === null) {
    return NextResponse.json({ mode: "templates", variants: writeFromTemplates(parsed.data), quota: null });
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

  let variants;
  try {
    variants = await generateWithProvider(cfg, parsed.data);
  } catch (err) {
    const message = err instanceof AiProviderError ? err.message : "Le service d'IA est momentanément indisponible. Réessayez dans quelques minutes.";
    return NextResponse.json({ error: `${message} Cette tentative n'a pas été décomptée de votre quota.` }, { status: 502 });
  }

  // Consommation atomique du quota (la base verrouille le profil pendant l'opération).
  const { data: consumed, error: rpcError } = await supabase.rpc("consume_ai_generation", { p_simulated: false });
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
    mode: "ai",
    variants,
    quota: { used: result.used, limit: result.limit_value, plan: result.plan },
  });
}
