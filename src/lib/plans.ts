/**
 * Offres et quotas. Ces valeurs sont dupliquées volontairement dans la
 * migration SQL (fonction plan_limits) : la base reste la source de vérité
 * au moment de consommer un quota, le code sert à l'affichage et aux
 * vérifications préalables.
 */
export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number; // en euros
  maxClients: number | null; // null = illimité
  maxAiGenerationsPerMonth: number;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuit",
    priceMonthly: 0,
    maxClients: 10,
    maxAiGenerationsPerMonth: 5,
    features: ["Jusqu'à 10 clients", "Suivi des devis et relances", "5 générations IA par mois", "Export de vos données"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 12,
    maxClients: null,
    maxAiGenerationsPerMonth: 100,
    features: ["Clients illimités", "Suivi des devis et relances", "100 générations IA par mois", "Export de vos données", "Support par email"],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 24,
    maxClients: null,
    maxAiGenerationsPerMonth: 300,
    features: ["Clients illimités", "Suivi des devis et relances", "300 générations IA par mois", "Export de vos données", "Support prioritaire"],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro, PLANS.business];

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "business";
}

export function getPlan(id: string | null | undefined): Plan {
  return isPlanId(id) ? PLANS[id] : PLANS.free;
}

/** Vérifie si un client supplémentaire peut être créé pour ce plan. */
export function canAddClient(planId: PlanId, currentCount: number): boolean {
  const limit = PLANS[planId].maxClients;
  return limit === null || currentCount < limit;
}

/** Vérifie si une génération IA supplémentaire est autorisée ce mois-ci. */
export function canGenerate(planId: PlanId, usedThisMonth: number): boolean {
  return usedThisMonth < PLANS[planId].maxAiGenerationsPerMonth;
}
