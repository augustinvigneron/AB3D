import { describe, it, expect } from "vitest";
import { PLANS, canAddClient, canGenerate, getPlan } from "@/lib/plans";

describe("quotas des offres", () => {
  it("respecte les limites annoncées", () => {
    expect(PLANS.free.maxClients).toBe(10);
    expect(PLANS.free.maxAiGenerationsPerMonth).toBe(5);
    expect(PLANS.pro.priceMonthly).toBe(12);
    expect(PLANS.pro.maxAiGenerationsPerMonth).toBe(100);
    expect(PLANS.business.priceMonthly).toBe(24);
    expect(PLANS.business.maxAiGenerationsPerMonth).toBe(300);
  });

  it("bloque le 11e client en offre gratuite, pas en Pro", () => {
    expect(canAddClient("free", 9)).toBe(true);
    expect(canAddClient("free", 10)).toBe(false);
    expect(canAddClient("pro", 10_000)).toBe(true);
  });

  it("bloque la génération quand le quota mensuel est atteint", () => {
    expect(canGenerate("free", 4)).toBe(true);
    expect(canGenerate("free", 5)).toBe(false);
    expect(canGenerate("pro", 99)).toBe(true);
    expect(canGenerate("pro", 100)).toBe(false);
    expect(canGenerate("business", 300)).toBe(false);
  });

  it("retombe sur l'offre gratuite pour un plan inconnu", () => {
    expect(getPlan("premium").id).toBe("free");
    expect(getPlan(null).id).toBe("free");
    expect(getPlan("business").id).toBe("business");
  });
});
