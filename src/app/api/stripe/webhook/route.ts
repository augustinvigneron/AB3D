import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planFromSubscription } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanId } from "@/lib/plans";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Webhook Stripe : seule voie d'activation ou de retrait d'un plan payant.
 * - La signature est vérifiée avec STRIPE_WEBHOOK_SECRET ; sans elle, rien n'est traité.
 * - Chaque événement est journalisé dans stripe_events : un doublon livré par
 *   Stripe est ignoré (idempotence).
 * - Toute erreur renvoie 500 : Stripe réessaiera.
 *
 * Non testé en conditions réelles dans ce dépôt : à valider avec
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook` (voir README).
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

  // Idempotence : l'insertion échoue (clé primaire) si l'événement a déjà été traité.
  const { error: dupError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dupError) {
    if (dupError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ error: "Journalisation impossible." }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId = idOf(session.subscription);
        if (session.mode !== "subscription" || session.payment_status !== "paid" || !subscriptionId) break;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (!userId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscription(admin, subscription, { userId, customerId: idOf(session.customer) });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await applySubscription(admin, subscription, { userId: subscription.metadata?.user_id, customerId: idOf(subscription.customer) });
        break;
      }
      case "invoice.payment_failed": {
        // Le plan est conservé tant que Stripe réessaie ; on signale seulement l'incident.
        const invoice = event.data.object;
        const customerId = idOf(invoice.customer);
        if (customerId) await admin.from("profiles").update({ subscription_status: "past_due" }).eq("stripe_customer_id", customerId);
        break;
      }
      default:
        break;
    }
  } catch {
    // On retire l'entrée du journal pour que la nouvelle tentative de Stripe soit traitée.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "Traitement échoué." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Reflète l'état d'un abonnement Stripe sur le profil : plan, statut, fin de période.
 * Le profil est retrouvé par user_id (metadata), sinon par stripe_subscription_id, sinon par stripe_customer_id.
 */
async function applySubscription(admin: Admin, subscription: Stripe.Subscription, ids: { userId?: string | null; customerId: string | null }) {
  const plan: PlanId = planFromSubscription(subscription);
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const patch = {
    plan,
    subscription_status: subscription.status,
    stripe_customer_id: ids.customerId,
    stripe_subscription_id: plan === "free" && subscription.status === "canceled" ? null : subscription.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };

  if (ids.userId) {
    const { error } = await admin.from("profiles").update(patch).eq("id", ids.userId);
    if (error) throw error;
    return;
  }
  const bySub = await admin.from("profiles").update(patch, { count: "exact" }).eq("stripe_subscription_id", subscription.id);
  if (bySub.error) throw bySub.error;
  if (bySub.count) return;
  if (ids.customerId) {
    const byCustomer = await admin.from("profiles").update(patch).eq("stripe_customer_id", ids.customerId);
    if (byCustomer.error) throw byCustomer.error;
  }
}
