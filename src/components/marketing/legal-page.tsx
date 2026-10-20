import type { ReactNode } from "react";
import { LEGAL, type LegalField } from "@/lib/legal";

/** Gabarit commun des pages légales. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-fg-subtle">Dernière mise à jour : {LEGAL.lastUpdated}</p>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-fg-muted [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-fg [&_strong]:text-fg [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warning-soft px-1 text-warning">[À compléter : {children}]</mark>;
}

const FIELD_LABELS: Record<LegalField, string> = {
  editorName: "nom ou raison sociale de l'éditeur",
  editorStatus: "statut juridique",
  address: "adresse",
  siren: "numéro SIREN",
  email: "email de contact",
  publicationDirector: "directeur de la publication",
  databaseRegion: "région de la base de données",
  courtCity: "ville du siège",
};

/** Affiche une information légale (src/lib/legal.ts) ou un encadré « À compléter ». */
export function Fill({ field }: { field: LegalField }) {
  const value = LEGAL[field].trim();
  if (!value) return <Placeholder>{FIELD_LABELS[field]}</Placeholder>;
  if (field === "email") return <a href={`mailto:${value}`}>{value}</a>;
  return <>{value}</>;
}
