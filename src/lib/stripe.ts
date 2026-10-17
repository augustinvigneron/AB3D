import "server-only";
import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

/** Stripe est optionnel : null tant que STRIPE_SECRET_KEY n'est pas défini. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { appInfo: { name: "Follow IA" } });
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      process.env.STRIPE_PRICE_PRO?.trim() &&
      process.env.STRIPE_PRICE_BUSINESS?.trim(),
  );
}

/** Stripe Tax (TVA automatique) : activé explicitement, car il exige une configuration dans le dashboard. */
export function isAutomaticTaxEnabled(): boolean {
  return process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === "true";
}

export function priceIdForPlan(plan: PlanId): string | null {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  if (plan === "business") return process.env.STRIPE_PRICE_BUSINESS?.trim() || null;
  return null;
}

/** Retrouve le plan correspondant à un identifiant de prix Stripe. */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO?.trim()) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS?.trim()) return "business";
  return null;
}

/** Un abonnement donne accès au plan payant uniquement dans ces statuts. */
export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Déduit le plan à appliquer à partir d'un abonnement Stripe.
 * `past_due` conserve le plan (Stripe réessaie le paiement) ; `unpaid`,
 * `canceled`, `incomplete_expired`… retombent sur l'offre gratuite.
 */
export function planFromSubscription(sub: Pick<Stripe.Subscription, "status" | "items">): PlanId {
  if (sub.status === "past_due") return planForPriceId(sub.items.data[0]?.price.id) ?? "free";
  if (!isSubscriptionActive(sub.status)) return "free";
  return planForPriceId(sub.items.data[0]?.price.id) ?? "free";
}
