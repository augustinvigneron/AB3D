"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plan-card";
import { ActionButton } from "@/components/app/action-button";
import { startCheckoutAction } from "@/app/(app)/parametres/abonnement/actions";
import { PLANS, PLAN_LIST, type PlanId } from "@/lib/plans";
import type { UpgradeHint } from "@/lib/validation/schemas";

const RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

type UpgradeContextValue = {
  currentPlan: PlanId;
  /** Ouvre la fenêtre « Vous n'avez pas le bon abonnement » avec les offres. */
  requireUpgrade: (hint: UpgradeHint) => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

/**
 * Fournit à toute l'application la fenêtre affichée quand on clique sur une
 * fonctionnalité réservée à une offre supérieure : un message clair, puis les
 * trois offres avec le bouton pour changer. Le plan n'est jamais modifié ici :
 * le paiement passe par Stripe Checkout et seul le webhook active l'offre.
 */
export function UpgradeProvider({ currentPlan, stripeReady, children }: { currentPlan: PlanId; stripeReady: boolean; children: ReactNode }) {
  const [hint, setHint] = useState<UpgradeHint | null>(null);
  const [open, setOpen] = useState(false);

  const requireUpgrade = useCallback((next: UpgradeHint) => {
    setHint(next);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ currentPlan, requireUpgrade }), [currentPlan, requireUpgrade]);

  const current = PLANS[currentPlan];
  const required = hint ? PLANS[hint.requiredPlan] : null;

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onClose={close}
        size="lg"
        title="Vous n'avez pas le bon abonnement"
        description={
          hint && required
            ? `« ${hint.feature} » est inclus à partir de l'offre ${required.name}. Vous êtes actuellement sur l'offre ${current.name}.`
            : undefined
        }
        footer={
          <>
            <Link href="/parametres/abonnement" onClick={close} className="link self-center text-sm">
              Voir mon abonnement
            </Link>
            <Button variant="secondary" onClick={close}>
              Fermer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_LIST.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isLower = RANK[plan.id] < RANK[currentPlan];
            const isRequired = hint?.requiredPlan === plan.id;
            return (
              <PlanCard key={plan.id} plan={plan} reveal={false} compact highlight={isRequired} badgeLabel="Offre nécessaire">
                {isCurrent ? (
                  <span className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm text-fg-muted">Votre offre actuelle</span>
                ) : isLower ? (
                  <span className="inline-flex h-10 w-full items-center justify-center text-xs text-fg-subtle">Inférieure à votre offre</span>
                ) : (
                  <ActionButton action={startCheckoutAction.bind(null, plan.id)} variant={isRequired ? "primary" : "secondary"} size="md" className="w-full">
                    {stripeReady ? `Choisir ${plan.name}` : "Bientôt disponible"}
                  </ActionButton>
                )}
              </PlanCard>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-fg-subtle">
          Votre nouvelle offre est activée dès confirmation du paiement. Sans engagement : résiliable à tout moment depuis Paramètres → Abonnement.
        </p>
      </Dialog>
    </UpgradeContext.Provider>
  );
}

/** Accès à la fenêtre depuis n'importe quel composant client. Sans fournisseur, renvoie vers la page Abonnement. */
export function useUpgrade(): UpgradeContextValue {
  const ctx = useContext(UpgradeContext);
  const router = useRouter();
  const fallback = useMemo<UpgradeContextValue>(
    () => ({ currentPlan: "free", requireUpgrade: () => router.push("/parametres/abonnement") }),
    [router],
  );
  return ctx ?? fallback;
}

type UpgradeButtonProps = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className"> & {
  feature: string;
  requiredPlan: PlanId;
  children: ReactNode;
};

/** Bouton qui, au lieu d'agir, ouvre la fenêtre des offres (à utiliser quand la fonctionnalité n'est pas incluse). */
export function UpgradeButton({ feature, requiredPlan, children, variant = "primary", size = "md", className }: UpgradeButtonProps) {
  const { requireUpgrade } = useUpgrade();
  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={() => requireUpgrade({ feature, requiredPlan })}>
      {children}
    </Button>
  );
}
