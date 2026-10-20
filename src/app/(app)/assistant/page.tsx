import type { Metadata } from "next";
import { PenLine, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { getAiConfig, providerName } from "@/lib/ai/provider";
import { PageHeader } from "@/components/ui/page-header";
import { AiAssistant, type AssistantQuote } from "@/components/app/ai-assistant";

export const metadata: Metadata = { title: "Assistant de rédaction" };

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const session = await requireUser();
  const cfg = getAiConfig();
  const [profile, params, quotesRes, usageRes] = await Promise.all([
    getProfile(session),
    searchParams,
    session.supabase
      .from("quotes")
      .select("id, title, amount, sent_at, status, client:clients(name)")
      .eq("user_id", session.user.id)
      .in("status", ["envoye", "en_attente", "brouillon"])
      .order("created_at", { ascending: false })
      .limit(50),
    session.supabase.rpc("ai_usage_this_month"),
  ]);
  const plan = getPlan(profile.plan);

  const quotes: AssistantQuote[] = ((quotesRes.data ?? []) as unknown as Array<{ id: string; title: string; amount: number; sent_at: string | null; client: { name: string } | null }>).map((q) => ({
    id: q.id,
    title: q.title,
    amount: Number(q.amount),
    sentAt: q.sent_at,
    clientName: q.client?.name ?? null,
  }));

  // ?devis= peut être l'identifiant d'un devis (lien depuis une relance) ; sinon il est repris comme texte libre.
  const devisParam = typeof params.devis === "string" ? params.devis.slice(0, 160) : "";
  const matchedQuote = quotes.find((q) => q.id === devisParam);
  const used = typeof usageRes.data === "number" ? usageRes.data : 0;

  return (
    <>
      <PageHeader
        icon={cfg ? Sparkles : PenLine}
        title={cfg ? "Assistant IA" : "Assistant de rédaction"}
        description="Choisissez un devis ou décrivez la situation : trois messages de relance prêts à copier. Vous gardez la main, rien n'est envoyé sans vous."
      />
      <AiAssistant
        mode={cfg ? "ai" : "templates"}
        providerLabel={cfg ? `${providerName(cfg)} (${cfg.model})` : null}
        initialQuota={{ used, limit: plan.maxAiGenerationsPerMonth, plan: plan.id }}
        quotes={quotes}
        defaults={{
          clientName: typeof params.client === "string" ? params.client.slice(0, 120) : (matchedQuote?.clientName ?? ""),
          quoteId: matchedQuote?.id ?? "",
          quoteInfo: devisParam && !matchedQuote ? `Devis : ${devisParam}` : "",
          senderName: profile.full_name ?? "",
          companyName: profile.company_name ?? "",
        }}
      />
    </>
  );
}
