import { describe, it, expect } from "vitest";
import { TESTIMONIALS } from "@/lib/testimonials";

describe("avis clients", () => {
  it("chaque avis publié est complet (nom, métier, texte, date AAAA-MM)", () => {
    for (const t of TESTIMONIALS) {
      expect(t.name.trim()).not.toBe("");
      expect(t.job.trim()).not.toBe("");
      expect(t.quote.trim().length).toBeGreaterThan(10);
      expect(t.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    }
  });
});
