import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planForPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : seule voie d'activation d'un plan payant.
 * La signature est vérifiée avec STRIPE_WEBHOOK_SECRET ; sans elle, rien n'est traité.
 *
 * Non testé en conditions réelles dans ce dépôt : à valider avec `stripe listen`
 * avant toute mise en production (voir README).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const admin = createAdminClient();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (!userId || session.payment_status !== "paid" || !session.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
        const plan = planForPriceId(subscription.items.data[0]?.price.id);
        if (!plan) break;
        await admin
          .from("profiles")
          .update({
            plan,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
            stripe_subscription_id: subscription.id,
          })
          .eq("id", userId);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const active = subscription.status === "active" || subscription.status === "trialing";
        const plan = active ? planForPriceId(subscription.items.data[0]?.price.id) : "free";
        if (!plan) break;
        await admin.from("profiles").update({ plan }).eq("stripe_subscription_id", subscription.id);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await admin.from("profiles").update({ plan: "free", stripe_subscription_id: null }).eq("stripe_subscription_id", subscription.id);
        break;
      }
      default:
        break;
    }
  } catch {
    // Stripe réessaiera l'envoi : on renvoie une erreur serveur.
    return NextResponse.json({ error: "Traitement échoué." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
