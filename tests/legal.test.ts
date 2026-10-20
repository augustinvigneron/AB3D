import { describe, it, expect } from "vitest";
import { LEGAL, missingLegalFields } from "@/lib/legal";

describe("informations légales", () => {
  it("liste les champs encore vides", () => {
    const missing = missingLegalFields();
    for (const field of missing) expect(LEGAL[field]).toBe("");
    expect(missing).not.toContain("lastUpdated");
  });

  it("un SIREN renseigné contient bien 9 chiffres", () => {
    if (LEGAL.siren) expect(LEGAL.siren.replace(/\s/g, "")).toMatch(/\d{9}/);
  });

  it("un email renseigné a un format valide", () => {
    if (LEGAL.email) expect(LEGAL.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
});
