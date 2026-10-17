import type { ReactNode } from "react";

/** Gabarit commun des pages légales. Les crochets [À compléter] doivent être remplis avant mise en production. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-fg-subtle">Dernière mise à jour : {updated}</p>
      <div className="prose-follow mt-8 space-y-6 text-sm leading-relaxed text-fg-muted [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warning-soft px-1 text-warning">[À compléter : {children}]</mark>;
}
