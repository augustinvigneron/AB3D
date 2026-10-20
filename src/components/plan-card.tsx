import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Carte d'offre, identique sur la page Tarifs et sur Paramètres → Abonnement. */
export function PlanCard({ plan, children }: { plan: Plan; children: ReactNode }) {
  return (
    <div className={cn("card flex flex-col p-6", plan.id === "pro" && "border-brand/60 shadow-[0_0_0_1px_rgb(124_92_255/0.3)]")}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {plan.id === "pro" && <Badge tone="brand">Recommandé</Badge>}
      </div>
      <p className="mt-3 text-4xl font-bold">
        {plan.priceMonthly} €<span className="text-base font-normal text-fg-subtle"> / mois</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-fg-muted">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">{children}</div>
    </div>
  );
}
