import { describe, it, expect } from "vitest";
import { PLANS, canAddClient, canGenerate, getPlan, nextPlan } from "@/lib/plans";

describe("quotas des offres", () => {
  it("respecte les limites annoncées", () => {
    expect(PLANS.free.maxClients).toBe(10);
    expect(PLANS.free.maxAiGenerationsPerMonth).toBe(5);
    expect(PLANS.pro.priceMonthly).toBe(12);
    expect(PLANS.pro.maxClients).toBe(300);
    expect(PLANS.pro.maxAiGenerationsPerMonth).toBe(100);
    expect(PLANS.business.priceMonthly).toBe(24);
    expect(PLANS.business.maxClients).toBeNull();
    expect(PLANS.business.maxAiGenerationsPerMonth).toBeNull();
  });

  it("réserve les raccourcis Gmail / Google Agenda à Business", () => {
    expect(PLANS.free.googleShortcuts).toBe(false);
    expect(PLANS.pro.googleShortcuts).toBe(false);
    expect(PLANS.business.googleShortcuts).toBe(true);
  });

  it("bloque le 11e client en gratuit, le 301e en Pro, jamais en Business", () => {
    expect(canAddClient("free", 9)).toBe(true);
    expect(canAddClient("free", 10)).toBe(false);
    expect(canAddClient("pro", 299)).toBe(true);
    expect(canAddClient("pro", 300)).toBe(false);
    expect(canAddClient("business", 100_000)).toBe(true);
  });

  it("bloque la génération quand le quota mensuel est atteint, sauf en Business", () => {
    expect(canGenerate("free", 4)).toBe(true);
    expect(canGenerate("free", 5)).toBe(false);
    expect(canGenerate("pro", 99)).toBe(true);
    expect(canGenerate("pro", 100)).toBe(false);
    expect(canGenerate("business", 100_000)).toBe(true);
  });

  it("retombe sur l'offre gratuite pour un plan inconnu", () => {
    expect(getPlan("premium").id).toBe("free");
    expect(getPlan(null).id).toBe("free");
    expect(getPlan("business").id).toBe("business");
  });
});

describe("offre à proposer quand une limite est atteinte", () => {
  it("propose l'offre juste au-dessus, et rien au-delà de Business", () => {
    expect(nextPlan("free")).toBe("pro");
    expect(nextPlan("pro")).toBe("business");
    expect(nextPlan("business")).toBeNull();
  });
});
