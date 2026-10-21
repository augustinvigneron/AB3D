import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlanCardProps = {
  plan: Plan;
  /** Décale l'apparition des cartes l'une après l'autre (voir globals.css, [data-reveal]). */
  index?: number;
  /** Carte mise en avant (bordure lumineuse + badge). Par défaut : l'offre Pro. */
  highlight?: boolean;
  badgeLabel?: string;
  /** Apparition au défilement. À désactiver dans une fenêtre modale (jamais observée). */
  reveal?: boolean;
  compact?: boolean;
  children: ReactNode;
};

/** Carte d'offre, identique sur la page Tarifs, sur Paramètres → Abonnement et dans la fenêtre « changer d'offre ». */
export function PlanCard({ plan, index = 0, highlight = plan.id === "pro", badgeLabel = "Recommandé", reveal = true, compact = false, children }: PlanCardProps) {
  return (
    <div
      data-reveal={reveal ? "" : undefined}
      style={{ "--i": index } as CSSProperties}
      className={cn("card lift flex flex-col", compact ? "p-5" : "p-6", highlight && "beam border-brand/60 shadow-[0_0_0_1px_rgb(124_92_255/0.3)]")}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {highlight && (
          <Badge tone="brand" className="shimmer">
            {badgeLabel}
          </Badge>
        )}
      </div>
      <p className={cn("mt-3 font-bold", compact ? "text-3xl" : "text-4xl")}>
        {plan.priceMonthly} €<span className="text-base font-normal text-fg-subtle"> / mois</span>
      </p>
      <ul data-stagger className={cn("flex-1 space-y-2 text-sm text-fg-muted", compact ? "mt-4" : "mt-5")}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
          </li>
        ))}
      </ul>
      <div className={compact ? "mt-5" : "mt-6"}>{children}</div>
    </div>
  );
}
