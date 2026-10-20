import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { PLAN_LIST, getPlan } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PlanCard } from "@/components/plan-card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/app/action-button";
import { startCheckoutAction, openBillingPortalAction } from "./actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({ searchParams }: PageProps<"/parametres/abonnement">) {
  const session = await requireUser();
  const [profile, { data: used }, params] = await Promise.all([getProfile(session), session.supabase.rpc("ai_usage_this_month"), searchParams]);
  const current = getPlan(profile.plan);
  const stripeReady = isStripeConfigured();
  const { count: clientCount } = await session.supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", session.user.id);

  return (
    <>
      <PageHeader icon={CreditCard} title="Abonnement" description="Choisissez l'offre adaptée à votre activité." />

      {params.paiement === "en_cours" && (
        <p role="status" className="mb-4 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-sm">
          Paiement reçu par Stripe. Votre offre sera activée dès confirmation du paiement (quelques secondes). Rechargez la page si besoin.
        </p>
      )}
      {params.paiement === "annule" && (
        <p role="status" className="mb-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
          Paiement annulé. Votre offre actuelle reste inchangée.
        </p>
      )}
      {profile.subscription_status === "past_due" && (
        <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          Le dernier paiement de votre abonnement a échoué. Mettez à jour votre moyen de paiement via « Gérer mon abonnement » pour conserver votre offre.
        </p>
      )}
      {!stripeReady && (
        <p className="mb-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg-muted">
          Les paiements ne sont pas encore activés sur cette instance : les offres payantes sont affichées à titre indicatif.
        </p>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-fg-muted">Offre actuelle</p>
            <p className="text-lg font-semibold">
              {current.name} <Badge tone={current.id === "free" ? "neutral" : "brand"}>{current.priceMonthly === 0 ? "Gratuit" : `${current.priceMonthly} €/mois`}</Badge>
            </p>
            {profile.current_period_end && current.id !== "free" && (
              <p className="text-xs text-fg-subtle">Prochaine échéance : {formatDate(profile.current_period_end)}</p>
            )}
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-fg-subtle">Clients</dt>
              <dd className="font-medium tabular-nums">
                {clientCount ?? 0}
                {current.maxClients ? ` / ${current.maxClients}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Générations de messages ce mois</dt>
              <dd className="font-medium tabular-nums">
                {typeof used === "number" ? used : 0}
                {current.maxAiGenerationsPerMonth === null ? " (illimité)" : ` / ${current.maxAiGenerationsPerMonth}`}
              </dd>
            </div>
          </dl>
          {profile.stripe_customer_id && stripeReady && (
            <ActionButton action={openBillingPortalAction} variant="outline">
              Gérer mon abonnement
            </ActionButton>
          )}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const isCurrent = plan.id === current.id;
          return (
            <PlanCard key={plan.id} plan={plan}>
              {isCurrent ? (
                <span className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm text-fg-muted">Votre offre actuelle</span>
              ) : plan.id === "free" ? (
                <span className="inline-flex h-10 w-full items-center justify-center text-xs text-fg-subtle">Résiliez via « Gérer mon abonnement »</span>
              ) : (
                <ActionButton action={startCheckoutAction.bind(null, plan.id)} variant={plan.id === "pro" ? "primary" : "secondary"} size="md" className="w-full">
                  {stripeReady ? `Choisir ${plan.name}` : "Bientôt disponible"}
                </ActionButton>
              )}
            </PlanCard>
          );
        })}
      </div>
    </>
  );
}
