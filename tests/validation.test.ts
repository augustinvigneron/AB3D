import { describe, it, expect } from "vitest";
import { clientSchema, quoteSchema, reminderSchema, aiRequestSchema, signUpSchema, formDataToObject, zodFieldErrors } from "@/lib/validation/schemas";

describe("clientSchema", () => {
  it("accepte un client minimal et normalise les champs vides en null", () => {
    const r = clientSchema.safeParse({ name: "  Jean Martin ", status: "prospect", email: "", company: "", phone: "", notes: "" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.name).toBe("Jean Martin");
    expect(r.data.email).toBeNull();
    expect(r.data.company).toBeNull();
    expect(r.data.last_contact_at).toBeNull();
  });

  it("refuse un nom vide et un email invalide", () => {
    const r = clientSchema.safeParse({ name: "", status: "actif", email: "pas-un-email" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const errors = zodFieldErrors(r.error);
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
  });

  it("refuse un statut inconnu et une date mal formée", () => {
    expect(clientSchema.safeParse({ name: "A", status: "vip" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "A", status: "actif", next_followup_at: "13/10/2026" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "A", status: "actif", next_followup_at: "2026-10-13" }).success).toBe(true);
  });

  it("met l'email en minuscules", () => {
    const r = clientSchema.safeParse({ name: "A", status: "actif", email: "Jean@Exemple.FR" });
    expect(r.success && r.data.email).toBe("jean@exemple.fr");
  });
});

describe("quoteSchema", () => {
  const client_id = "123e4567-e89b-12d3-a456-426614174000";

  it("convertit le montant en nombre arrondi au centime", () => {
    const r = quoteSchema.safeParse({ title: "Devis", client_id, amount: "1234.567", status: "envoye" });
    expect(r.success && r.data.amount).toBe(1234.57);
  });

  it("refuse un montant négatif ou non numérique", () => {
    expect(quoteSchema.safeParse({ title: "Devis", client_id, amount: "-5", status: "envoye" }).success).toBe(false);
    expect(quoteSchema.safeParse({ title: "Devis", client_id, amount: "abc", status: "envoye" }).success).toBe(false);
  });

  it("refuse un client_id qui n'est pas un UUID", () => {
    expect(quoteSchema.safeParse({ title: "Devis", client_id: "1", amount: "10", status: "envoye" }).success).toBe(false);
  });
});

describe("reminderSchema", () => {
  it("exige une date et accepte des références vides", () => {
    const ok = reminderSchema.safeParse({ title: "Relancer", due_at: "2026-10-20", channel: "email", client_id: "", quote_id: "" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.client_id).toBeNull();
      expect(ok.data.quote_id).toBeNull();
    }
    expect(reminderSchema.safeParse({ title: "Relancer", channel: "email" }).success).toBe(false);
  });
});

describe("aiRequestSchema", () => {
  it("applique des valeurs par défaut aux champs optionnels", () => {
    const r = aiRequestSchema.safeParse({ clientName: "Camille", messageType: "relance_devis", tone: "professionnel" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.context).toBe("");
      expect(r.data.quoteInfo).toBe("");
    }
  });

  it("refuse un type de message inconnu", () => {
    expect(aiRequestSchema.safeParse({ clientName: "Camille", messageType: "spam", tone: "professionnel" }).success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("impose 8 caractères de mot de passe et un email valide", () => {
    expect(signUpSchema.safeParse({ fullName: "Marie", email: "marie@exemple.fr", password: "court" }).success).toBe(false);
    expect(signUpSchema.safeParse({ fullName: "Marie", email: "marie", password: "assezlong1" }).success).toBe(false);
    expect(signUpSchema.safeParse({ fullName: "Marie", email: "Marie@Exemple.fr", password: "assezlong1" }).success).toBe(true);
  });
});

describe("formDataToObject", () => {
  it("ignore les champs internes $ACTION_*", () => {
    const fd = new FormData();
    fd.set("name", "Jean");
    fd.set("$ACTION_ID_abc", "x");
    expect(formDataToObject(fd)).toEqual({ name: "Jean" });
  });
});
