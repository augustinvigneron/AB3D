import "server-only";
import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

/** Stripe est optionnel : null tant que STRIPE_SECRET_KEY n'est pas défini. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim() && process.env.STRIPE_PRICE_PRO?.trim() && process.env.STRIPE_PRICE_BUSINESS?.trim());
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
