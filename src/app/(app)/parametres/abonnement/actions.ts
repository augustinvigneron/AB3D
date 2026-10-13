"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { isPlanId } from "@/lib/plans";
import { getStripe, isStripeConfigured, priceIdForPlan } from "@/lib/stripe";
import type { ActionState } from "@/lib/validation/schemas";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Démarre un paiement Stripe Checkout. Le plan n'est JAMAIS modifié ici :
 * seul le webhook, après vérification de la signature, active l'abonnement.
 */
export async function startCheckoutAction(planId: string): Promise<ActionState> {
  const session = await requireUser();
  if (!isPlanId(planId) || planId === "free") return { ok: false, message: "Offre invalide." };
  if (!isStripeConfigured()) {
    return { ok: false, message: "Les paiements ne sont pas encore activés sur cette instance. Contactez l'administrateur." };
  }
  const stripe = getStripe();
  const price = priceIdForPlan(planId);
  if (!stripe || !price) return { ok: false, message: "Offre indisponible." };

  const profile = await getProfile(session);
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: session.user.id,
    customer: profile.stripe_customer_id ?? undefined,
    customer_email: profile.stripe_customer_id ? undefined : session.user.email,
    success_url: `${siteUrl()}/parametres/abonnement?paiement=en_cours`,
    cancel_url: `${siteUrl()}/parametres/abonnement?paiement=annule`,
    locale: "fr",
  });

  if (!checkout.url) return { ok: false, message: "Impossible de démarrer le paiement." };
  redirect(checkout.url);
}

/** Ouvre le portail client Stripe (gestion / résiliation). */
export async function openBillingPortalAction(): Promise<ActionState> {
  const session = await requireUser();
  const stripe = getStripe();
  const profile = await getProfile(session);
  if (!stripe || !profile.stripe_customer_id) return { ok: false, message: "Aucun abonnement Stripe associé à ce compte." };

  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/parametres/abonnement`,
  });
  redirect(portal.url);
}
