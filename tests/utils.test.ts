import { describe, it, expect } from "vitest";
import { classifyDueDate, addDaysISO, todayISO, formatEuro, initials } from "@/lib/utils";
import { computeStats } from "@/lib/data/overview";

describe("classifyDueDate", () => {
  const today = "2026-10-13";
  it("classe aujourd'hui / en retard / à venir / aucune", () => {
    expect(classifyDueDate("2026-10-13", today)).toBe("today");
    expect(classifyDueDate("2026-10-12", today)).toBe("overdue");
    expect(classifyDueDate("2026-10-14", today)).toBe("upcoming");
    expect(classifyDueDate(null, today)).toBe("none");
  });
});

describe("dates ISO", () => {
  it("addDaysISO gère les changements de mois et d'année", () => {
    expect(addDaysISO("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("todayISO renvoie le format YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("computeStats", () => {
  it("calcule les compteurs du tableau de bord", () => {
    const stats = computeStats(
      [{ status: "prospect" }, { status: "prospect" }, { status: "actif" }],
      [
        { status: "envoye", amount: 100 },
        { status: "en_attente", amount: 250.5 },
        { status: "accepte", amount: 999 },
        { status: "brouillon", amount: 5 },
      ],
      [
        { status: "a_faire", due_at: "2026-10-13" },
        { status: "a_faire", due_at: "2026-10-01" },
        { status: "a_faire", due_at: "2026-10-20" },
        { status: "terminee", due_at: "2026-10-01" },
      ],
      "2026-10-13",
    );
    expect(stats).toEqual({
      totalClients: 3,
      prospects: 2,
      remindersToday: 1,
      remindersOverdue: 1,
      pendingQuotes: 2,
      pendingQuotesAmount: 350.5,
    });
  });
});

describe("formatage", () => {
  it("formatEuro utilise le format français", () => {
    expect(formatEuro(1234.5).replace(/ | /g, " ")).toBe("1 234,50 €");
  });
  it("initials prend les deux premières lettres de mots", () => {
    expect(initials("Camille Rousseau")).toBe("CR");
    expect(initials("madame")).toBe("M");
  });
});
