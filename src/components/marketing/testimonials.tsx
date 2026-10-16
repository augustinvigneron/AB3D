import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/testimonials";
import { initials } from "@/lib/utils";

function formatMonth(value: string): string {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return "";
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

/** Section d'avis clients. Ne rend rien tant qu'aucun avis réel n'a été ajouté. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section id="avis" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Ils l'utilisent au quotidien</h2>
        <p className="mt-3 text-fg-muted">Avis d'utilisateurs, publiés avec leur accord.</p>
      </div>
      <ul className="mt-12 flex flex-wrap justify-center gap-5">
        {items.map((t) => (
          <li key={`${t.name}-${t.date}`} className="card flex w-full flex-col p-6 sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)]">
            <Quote className="size-5 text-brand" aria-hidden />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-fg">« {t.quote} »</blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-[#c4b5ff]" aria-hidden>
                {initials(t.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-fg-subtle">
                  {t.job}
                  {t.city ? ` · ${t.city}` : ""}
                  {t.date ? ` · ${formatMonth(t.date)}` : ""}
                </p>
              </div>
            </figcaption>
          </li>
        ))}
      </ul>
    </section>
  );
}
