"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { isPlanId } from "@/lib/plans";
import { getStripe, isAutomaticTaxEnabled, isStripeConfigured, priceIdForPlan } from "@/lib/stripe";
import type { ActionState } from "@/lib/validation/schemas";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Démarre un paiement Stripe Checkout (abonnement mensuel). Le plan n'est JAMAIS
 * modifié ici : seul le webhook, après vérification de la signature, l'active.
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
  if (profile.stripe_subscription_id && profile.plan !== "free") {
    return { ok: false, message: "Vous avez déjà un abonnement actif : utilisez « Gérer mon abonnement » pour changer d'offre." };
  }

  const automaticTax = isAutomaticTaxEnabled();
  const existingCustomer = profile.stripe_customer_id ?? undefined;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: session.user.id,
    metadata: { user_id: session.user.id, plan: planId },
    subscription_data: { metadata: { user_id: session.user.id, plan: planId } },
    customer: existingCustomer,
    customer_email: existingCustomer ? undefined : session.user.email,
    // Stripe Tax a besoin d'une adresse de facturation ; on collecte aussi le n° de TVA (B2B).
    billing_address_collection: automaticTax ? "required" : "auto",
    automatic_tax: { enabled: automaticTax },
    tax_id_collection: automaticTax ? { enabled: true } : undefined,
    customer_update: existingCustomer ? { address: "auto", name: "auto" } : undefined,
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/parametres/abonnement?paiement=en_cours`,
    cancel_url: `${siteUrl()}/parametres/abonnement?paiement=annule`,
    locale: "fr",
  };

  let url: string | null;
  try {
    const checkout = await stripe.checkout.sessions.create(params, { idempotencyKey: `checkout:${session.user.id}:${planId}:${Date.now()}` });
    url = checkout.url;
  } catch {
    return { ok: false, message: "Impossible de démarrer le paiement. Réessayez ou contactez le support." };
  }
  if (!url) return { ok: false, message: "Impossible de démarrer le paiement." };
  redirect(url);
}

/** Ouvre le portail client Stripe (changement d'offre, moyen de paiement, résiliation, factures). */
export async function openBillingPortalAction(): Promise<ActionState> {
  const session = await requireUser();
  const stripe = getStripe();
  const profile = await getProfile(session);
  if (!stripe || !profile.stripe_customer_id) return { ok: false, message: "Aucun abonnement Stripe associé à ce compte." };

  let url: string;
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/parametres/abonnement`,
      locale: "fr",
    });
    url = portal.url;
  } catch {
    return { ok: false, message: "Portail indisponible. Vérifiez que le portail client est configuré dans Stripe." };
  }
  redirect(url);
}
