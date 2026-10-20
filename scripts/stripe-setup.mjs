#!/usr/bin/env node
/**
 * Crée (ou retrouve) les produits et prix Stripe de Nexora, puis affiche
 * les variables d'environnement à copier dans .env.local.
 *
 * Usage (depuis la racine du projet, avec votre clé de TEST) :
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 *
 * Idempotent : relancer le script ne crée pas de doublons (recherche par lookup_key).
 * Les prix sont TTC (tax_behavior "inclusive") pour correspondre aux tarifs affichés.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante. Exemple : STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error("Par sécurité, ce script n'accepte qu'une clé de TEST (sk_test_...). Créez les prix de production depuis le dashboard.");
  process.exit(1);
}

const stripe = new Stripe(key);

const PLANS = [
  { lookupKey: "nexora_pro_monthly", name: "Nexora — Pro", description: "Clients illimités, 100 générations de messages par mois.", amount: 1200, env: "STRIPE_PRICE_PRO" },
  { lookupKey: "nexora_business_monthly", name: "Nexora — Business", description: "Clients illimités, 300 générations de messages par mois, support prioritaire.", amount: 2400, env: "STRIPE_PRICE_BUSINESS" },
];

const envLines = [];
for (const plan of PLANS) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  let price = existing.data[0];
  if (price) {
    console.log(`✓ Prix existant pour ${plan.name} : ${price.id}`);
  } else {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      // Code taxe Stripe pour un logiciel SaaS (utilisé par Stripe Tax).
      tax_code: "txcd_10103001",
    });
    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: plan.amount,
      recurring: { interval: "month" },
      tax_behavior: "inclusive",
      lookup_key: plan.lookupKey,
    });
    console.log(`+ Créé ${plan.name} : produit ${product.id}, prix ${price.id}`);
  }
  envLines.push(`${plan.env}=${price.id}`);
}

console.log("\nÀ copier dans .env.local :\n");
console.log(envLines.join("\n"));
console.log("\nEnsuite :");
console.log("  1. stripe listen --forward-to localhost:3000/api/stripe/webhook   → copier le whsec_... dans STRIPE_WEBHOOK_SECRET");
console.log("  2. Dashboard → Paramètres → Portail client : enregistrer la configuration par défaut (sinon « Gérer mon abonnement » échoue)");
console.log("  3. (Optionnel) Dashboard → Tax : activer Stripe Tax, puis STRIPE_AUTOMATIC_TAX=true");
