import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { planForPriceId, planFromSubscription, isStripeConfigured, isAutomaticTaxEnabled, isSubscriptionActive } from "@/lib/stripe";

const ENV_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_PRO", "STRIPE_PRICE_BUSINESS", "STRIPE_AUTOMATIC_TAX"] as const;
const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  process.env.STRIPE_PRICE_PRO = "price_pro";
  process.env.STRIPE_PRICE_BUSINESS = "price_business";
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function sub(status: string, priceId: string) {
  return { status, items: { data: [{ price: { id: priceId } }] } } as unknown as Parameters<typeof planFromSubscription>[0];
}

describe("planForPriceId", () => {
  it("associe les identifiants de prix aux offres", () => {
    expect(planForPriceId("price_pro")).toBe("pro");
    expect(planForPriceId("price_business")).toBe("business");
    expect(planForPriceId("price_inconnu")).toBeNull();
    expect(planForPriceId(null)).toBeNull();
  });
});

describe("planFromSubscription", () => {
  it("active le plan uniquement pour un abonnement actif ou en essai", () => {
    expect(planFromSubscription(sub("active", "price_pro"))).toBe("pro");
    expect(planFromSubscription(sub("trialing", "price_business"))).toBe("business");
  });
  it("conserve le plan en past_due (Stripe réessaie), retire sinon", () => {
    expect(planFromSubscription(sub("past_due", "price_pro"))).toBe("pro");
    expect(planFromSubscription(sub("unpaid", "price_pro"))).toBe("free");
    expect(planFromSubscription(sub("canceled", "price_pro"))).toBe("free");
    expect(planFromSubscription(sub("incomplete", "price_pro"))).toBe("free");
  });
  it("retombe sur gratuit si le prix est inconnu", () => {
    expect(planFromSubscription(sub("active", "price_autre"))).toBe("free");
  });
});

describe("configuration", () => {
  it("isStripeConfigured exige les quatre variables", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(isStripeConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    expect(isStripeConfigured()).toBe(true);
  });
  it("Stripe Tax est désactivé par défaut", () => {
    delete process.env.STRIPE_AUTOMATIC_TAX;
    expect(isAutomaticTaxEnabled()).toBe(false);
    process.env.STRIPE_AUTOMATIC_TAX = "true";
    expect(isAutomaticTaxEnabled()).toBe(true);
  });
  it("isSubscriptionActive", () => {
    expect(isSubscriptionActive("active")).toBe(true);
    expect(isSubscriptionActive("past_due")).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});
