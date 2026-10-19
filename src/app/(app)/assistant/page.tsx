import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { getAiConfig, providerName } from "@/lib/ai/provider";
import { PageHeader } from "@/components/ui/page-header";
import { AiAssistant } from "@/components/app/ai-assistant";

export const metadata: Metadata = { title: "Assistant IA" };

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const session = await requireUser();
  const [profile, { data: used }, params] = await Promise.all([getProfile(session), session.supabase.rpc("ai_usage_this_month"), searchParams]);
  const plan = getPlan(profile.plan);
  const cfg = getAiConfig();

  return (
    <>
      <PageHeader
        icon={Sparkles}
        title="Assistant IA"
        description="Décrivez la situation, obtenez trois messages de relance en français. Vous gardez la main : rien n'est envoyé sans vous."
      />
      <AiAssistant
        aiConfigured={cfg !== null}
        providerLabel={cfg ? `${providerName(cfg)} (${cfg.model})` : null}
        initialQuota={{ used: typeof used === "number" ? used : 0, limit: plan.maxAiGenerationsPerMonth, plan: plan.id }}
        defaults={{
          clientName: typeof params.client === "string" ? params.client.slice(0, 120) : "",
          quoteInfo: typeof params.devis === "string" ? `Devis : ${params.devis.slice(0, 160)}` : "",
          senderName: profile.full_name ?? "",
          companyName: profile.company_name ?? "",
        }}
      />
    </>
  );
}
