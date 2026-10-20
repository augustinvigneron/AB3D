import { describe, it, expect } from "vitest";
import { gmailComposeUrl, googleCalendarUrl } from "@/lib/google-links";

describe("liens Google pré-remplis", () => {
  it("pré-remplit destinataire, objet et message dans Gmail", () => {
    const url = new URL(gmailComposeUrl({ to: "marie@exemple.fr", subject: "Votre devis", body: "Bonjour Marie,\nÀ bientôt & merci" }));
    expect(url.origin + url.pathname).toBe("https://mail.google.com/mail/");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("to")).toBe("marie@exemple.fr");
    expect(url.searchParams.get("su")).toBe("Votre devis");
    expect(url.searchParams.get("body")).toBe("Bonjour Marie,\nÀ bientôt & merci");
  });

  it("omet le destinataire s'il est inconnu", () => {
    const url = new URL(gmailComposeUrl({ to: null, body: "Bonjour" }));
    expect(url.searchParams.has("to")).toBe(false);
    expect(url.searchParams.has("su")).toBe(false);
  });

  it("crée un événement d'une journée dans Google Agenda", () => {
    const url = new URL(googleCalendarUrl({ title: "Relancer Marie", date: "2026-12-31", details: "Par téléphone" }));
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Relancer Marie");
    expect(url.searchParams.get("dates")).toBe("20261231/20270101");
    expect(url.searchParams.get("details")).toBe("Par téléphone");
  });
});
