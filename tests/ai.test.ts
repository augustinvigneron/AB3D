import { describe, it, expect } from "vitest";
import { buildUserPrompt, parseVariants, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { writeFromTemplates } from "@/lib/ai/templates";
import type { AiRequest } from "@/lib/validation/schemas";

const base: AiRequest = {
  clientName: "Camille Rousseau",
  context: "",
  messageType: "relance_devis",
  tone: "professionnel",
  quoteInfo: "",
  senderName: "",
  companyName: "",
  quoteTitle: "",
  quoteAmount: null,
  quoteSentAt: null,
  seed: 0,
};

describe("writeFromTemplates (rédaction sans IA)", () => {
  const TODAY = "2026-10-20";

  it("produit exactement trois variantes dans l'ordre attendu", () => {
    const v = writeFromTemplates(base, TODAY);
    expect(v.map((x) => x.style)).toEqual(["professionnel", "amical", "court"]);
    v.forEach((x) => {
      expect(x.body.startsWith("Bonjour Camille Rousseau,")).toBe(true);
      expect(x.subject.length).toBeGreaterThan(3);
    });
  });

  it("n'invente aucun montant ni date quand rien n'est fourni", () => {
    for (const type of ["relance_devis", "prise_de_nouvelles", "remerciement", "rappel_rdv", "autre"] as const) {
      for (let seed = 0; seed < 5; seed++) {
        for (const x of writeFromTemplates({ ...base, messageType: type, seed }, TODAY)) {
          expect(x.body).not.toMatch(/\d/);
          expect(x.body).not.toContain("€");
          expect(x.body).toContain("[Votre nom]");
        }
      }
    }
  });

  it("reprend le titre, le montant et la date du devis choisi", () => {
    const v = writeFromTemplates({ ...base, quoteTitle: "Rénovation salle de bain", quoteAmount: 7900, quoteSentAt: "2026-10-03" }, TODAY);
    const pro = v[0].body.replace(/\u202f|\u00a0/g, " ");
    expect(pro).toContain("« Rénovation salle de bain »");
    expect(pro).toContain("7 900 €");
    expect(pro).toContain("le 3 octobre");
    expect(v[2].body.replace(/\u00a0/g, " ")).toContain("« Rénovation salle de bain »");
  });

  it("dit « il y a quelques jours » pour un devis récent, et propose une porte de sortie pour un devis ancien", () => {
    const recent = writeFromTemplates({ ...base, quoteTitle: "Cuisine", quoteSentAt: "2026-10-17" }, TODAY)[0].body;
    expect(recent).toContain("il y a quelques jours");
    const old = writeFromTemplates({ ...base, quoteTitle: "Cuisine", quoteSentAt: "2026-08-01" }, TODAY)[0].body;
    expect(old).toMatch(/n'est plus d'actualité|vos besoins ont changé/);
  });

  it("n'écrit jamais « de le » ni « à le » (contractions du / au)", () => {
    for (let seed = 0; seed < 12; seed++) {
      for (const quoteTitle of ["", "Cuisine"]) {
        for (const x of writeFromTemplates({ ...base, seed, quoteTitle, quoteSentAt: quoteTitle ? "2026-10-01" : null }, TODAY)) {
          expect(x.body).not.toMatch(/\b(de|à) le\b/);
        }
      }
    }
  });

  it("rattache un complément « Suite à… » à la phrase suivante, sans fragment isolé", () => {
    for (let seed = 0; seed < 8; seed++) {
      const v = writeFromTemplates({ ...base, seed, context: "suite à notre visite sur le chantier" }, TODAY);
      expect(v[0].body).toMatch(/Suite à notre visite sur le chantier, [a-zé]/);
      expect(v[1].body).toMatch(/Suite à notre visite sur le chantier, [a-zé]/);
      expect(v[0].body).not.toContain("chantier.");
    }
  });

  it("ajoute une phrase complète après l'accroche", () => {
    const v = writeFromTemplates({ ...base, context: "j'ai bien noté vos remarques sur la couleur" }, TODAY);
    expect(v[0].body).toContain("J'ai bien noté vos remarques sur la couleur.");
  });

  it("ne termine pas un remerciement par « Merci d'avance »", () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const x of writeFromTemplates({ ...base, seed, messageType: "remerciement", tone: "direct" }, TODAY)) {
        expect(x.body).not.toMatch(/Merci d'avance|Dans l'attente de votre retour/);
      }
    }
  });

  it("reprend la phrase personnelle et la signature telles quelles", () => {
    const v = writeFromTemplates({ ...base, context: "Suite à notre échange de mardi.", senderName: "Marie", companyName: "Dupont Plomberie" }, TODAY);
    expect(v[0].body).toContain("Suite à notre échange de mardi, ");
    for (const x of v) {
      expect(x.body).toContain("Marie — Dupont Plomberie");
      expect(x.body).not.toContain("[Votre nom]");
    }
  });

  it("est reproductible pour une même graine et varie avec « Autres formulations »", () => {
    const a = writeFromTemplates({ ...base, seed: 0 }, TODAY);
    expect(writeFromTemplates({ ...base, seed: 0 }, TODAY)).toEqual(a);
    const bodies = new Set(Array.from({ length: 6 }, (_, seed) => writeFromTemplates({ ...base, seed }, TODAY)[0].body));
    expect(bodies.size).toBeGreaterThan(1);
  });

  it("garde les guillemets collés au titre (espaces insécables)", () => {
    const v = writeFromTemplates({ ...base, quoteTitle: "Cuisine" }, TODAY);
    expect(v[0].body).toContain("«\u00a0Cuisine\u00a0»");
    expect(v[0].subject).toContain("«\u00a0Cuisine\u00a0»");
  });

  it("la version courte est plus courte que la version professionnelle", () => {
    const [pro, , court] = writeFromTemplates(base, TODAY);
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
