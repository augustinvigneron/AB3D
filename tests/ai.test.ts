import { describe, it, expect } from "vitest";
import { buildUserPrompt, parseVariants, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { simulateVariants } from "@/lib/ai/simulation";
import type { AiRequest } from "@/lib/validation/schemas";

const base: AiRequest = {
  clientName: "Camille Rousseau",
  context: "",
  messageType: "relance_devis",
  tone: "professionnel",
  quoteInfo: "",
  senderName: "",
  companyName: "",
};

describe("simulateVariants (mode démonstration)", () => {
  it("produit exactement trois variantes dans l'ordre attendu", () => {
    const v = simulateVariants(base);
    expect(v.map((x) => x.style)).toEqual(["professionnel", "amical", "court"]);
    v.forEach((x) => expect(x.body.length).toBeGreaterThan(20));
  });

  it("n'invente aucun montant ni date quand rien n'est fourni", () => {
    const v = simulateVariants(base);
    for (const x of v) {
      expect(x.body).not.toMatch(/\d+\s?€/);
      expect(x.body).not.toMatch(/\d{1,2}\/\d{1,2}/);
      expect(x.body).toContain("[Votre nom]");
    }
  });

  it("reprend uniquement les informations de devis fournies", () => {
    const v = simulateVariants({ ...base, quoteInfo: "devis n°24 de 1 850 €", senderName: "Marie", companyName: "Dupont Plomberie" });
    for (const x of v) {
      expect(x.body).toContain("devis n°24 de 1 850 €");
      expect(x.body).toContain("Marie — Dupont Plomberie");
      expect(x.body).not.toContain("[Votre nom]");
    }
  });

  it("la version courte est plus courte que la version professionnelle", () => {
    const [pro, , court] = simulateVariants(base);
    expect(court.body.length).toBeLessThan(pro.body.length);
  });
});

describe("buildUserPrompt / SYSTEM_PROMPT", () => {
  it("signale explicitement l'absence d'informations de devis", () => {
    expect(buildUserPrompt(base)).toContain("ne mentionne aucun montant ni date");
  });

  it("le prompt système interdit d'inventer montants, dates et promesses", () => {
    expect(SYSTEM_PROMPT).toMatch(/N'invente JAMAIS de montant, de date/);
    expect(SYSTEM_PROMPT).toContain("JSON");
  });
});

describe("parseVariants", () => {
  it("extrait un JSON valide même entouré de texte", () => {
    const raw = `Voici :\n{"variants":[{"style":"professionnel","subject":"A","body":"Bonjour"},{"style":"amical","subject":"B","body":"Salut"},{"style":"court","subject":"C","body":"Hello"}]}\nFin.`;
    const v = parseVariants(raw);
    expect(v).not.toBeNull();
    expect(v?.[1].body).toBe("Salut");
    expect(v?.[2].label).toBe("Courte et directe");
  });

  it("renvoie null si une variante manque ou si le JSON est cassé", () => {
    expect(parseVariants('{"variants":[{"style":"professionnel","body":"x"}]}')).toBeNull();
    expect(parseVariants("pas du json")).toBeNull();
    expect(parseVariants('{"variants":"nope"}')).toBeNull();
  });
});
