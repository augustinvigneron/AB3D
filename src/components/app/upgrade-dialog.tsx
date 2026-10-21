"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PlanCard } from "@/components/plan-card";
import { openBillingPortalAction, startCheckoutAction } from "@/app/(app)/parametres/abonnement/actions";
import { PLANS, PLAN_LIST, nextPlan, type PlanId } from "@/lib/plans";
import type { ActionState, UpgradeHint } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

const RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

type UpgradeContextValue = {
  currentPlan: PlanId;
  /** Ouvre la fenêtre « Vous n'avez pas le bon abonnement » avec les offres. */
  requireUpgrade: (hint: UpgradeHint) => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

type UpgradeProviderProps = {
  currentPlan: PlanId;
  stripeReady: boolean;
  /** Abonnement Stripe payant en cours : le changement d'offre passe par le portail client, pas par un nouveau paiement. */
  hasSubscription: boolean;
  children: ReactNode;
};

/**
 * Fournit à toute l'application la fenêtre affichée quand on clique sur une
 * fonctionnalité réservée à une offre supérieure : un message clair, puis les
 * offres avec le bouton pour changer. Le plan n'est jamais modifié ici : le
 * paiement passe par Stripe et seul le webhook active l'offre.
 */
export function UpgradeProvider({ currentPlan, stripeReady, hasSubscription, children }: UpgradeProviderProps) {
  const [hint, setHint] = useState<UpgradeHint | null>(null);
  // La fenêtre est liée à la page où elle a été ouverte : elle se referme si l'on change de page (ex. : retour arrière).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const pathname = usePathname();
  const open = openOn === pathname;

  const requireUpgrade = useCallback(
    (next: UpgradeHint) => {
      // Garde-fou : l'offre actuelle inclut déjà la fonctionnalité (page pas à jour, par exemple).
      if (RANK[next.requiredPlan] <= RANK[currentPlan]) {
        toast(`Votre offre ${PLANS[currentPlan].name} inclut déjà cette fonctionnalité. Rechargez la page ; si le blocage persiste, contactez le support.`, "info");
        return;
      }
      setHint(next);
      setError(null);
      setOpenOn(pathname);
    },
    [currentPlan, toast, pathname],
  );
  const close = useCallback(() => setOpenOn(null), []);
  const value = useMemo(() => ({ currentPlan, requireUpgrade }), [currentPlan, requireUpgrade]);

  // Erreur affichée DANS la fenêtre : une notification serait cachée derrière elle.
  function choose(planId: PlanId) {
    setError(null);
    setPendingPlan(planId);
    startTransition(async () => {
      const action: () => Promise<ActionState> = hasSubscription ? openBillingPortalAction : () => startCheckoutAction(planId);
      const res = await action(); // redirige vers Stripe si tout va bien
      if (!res.ok) setError(res.message ?? "Impossible de démarrer le paiement. Réessayez.");
      setPendingPlan(null);
    });
  }

  const current = PLANS[currentPlan];
  const required = hint ? PLANS[hint.requiredPlan] : null;
  // Seules l'offre actuelle et les offres supérieures sont utiles ici.
  const visible = PLAN_LIST.filter((p) => RANK[p.id] >= RANK[currentPlan]);

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
            ? `${hint.feature} : disponible ${nextPlan(required.id) ? "à partir de" : "avec"} l'offre ${required.name}. Votre offre actuelle : ${current.name}.`
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
        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            {error}
          </p>
        )}
        <div className={cn("grid gap-4", visible.length === 3 ? "md:grid-cols-3" : visible.length === 2 ? "mx-auto max-w-2xl md:grid-cols-2" : "mx-auto max-w-sm")}>
          {visible.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isRequired = hint?.requiredPlan === plan.id;
            const missesFeature = hint !== null && RANK[plan.id] < RANK[hint.requiredPlan];
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                reveal={false}
                compact
                highlight={isRequired && !isCurrent}
                badgeLabel="Offre nécessaire"
                // Sur téléphone, l'offre nécessaire passe en premier et l'offre actuelle en dernier.
                className={isRequired ? "max-md:order-first" : isCurrent ? "max-md:order-last" : undefined}
              >
                {isCurrent ? (
                  <span className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm text-fg-muted">Votre offre actuelle</span>
                ) : stripeReady ? (
                  <Button
                    type="button"
                    variant={isRequired ? "primary" : "secondary"}
                    className="w-full"
                    loading={pendingPlan === plan.id}
                    disabled={pendingPlan !== null}
                    onClick={() => choose(plan.id)}
                  >
                    {hasSubscription ? `Passer à ${plan.name}` : `Choisir ${plan.name}`}
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" className="w-full" disabled>
                    Bientôt disponible
                  </Button>
                )}
                {!isCurrent && missesFeature && <p className="mt-2 text-center text-xs text-fg-muted">N'inclut pas cette fonctionnalité</p>}
              </PlanCard>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-fg-muted">
          {!stripeReady
            ? "Les paiements ne sont pas encore activés : les offres payantes sont affichées à titre indicatif."
            : hasSubscription
              ? "Le changement d'offre se fait dans votre espace de paiement sécurisé (Stripe). Il est pris en compte dès sa confirmation."
              : "Abonnement mensuel sans engagement de durée, prix TTC. Votre nouvelle offre est activée dès confirmation du paiement ; vous pouvez résilier à tout moment depuis Paramètres → Abonnement (effet à la fin du mois en cours)."}
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

type UpgradeButtonProps = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className" | "title"> & {
  feature: string;
  requiredPlan: PlanId;
  children: ReactNode;
};

/** Bouton qui, au lieu d'agir, ouvre la fenêtre des offres (à utiliser quand la fonctionnalité n'est pas incluse). */
export function UpgradeButton({ feature, requiredPlan, children, variant = "primary", size = "md", className, title }: UpgradeButtonProps) {
  const { requireUpgrade } = useUpgrade();
  return (
    <Button type="button" variant={variant} size={size} className={className} title={title} onClick={() => requireUpgrade({ feature, requiredPlan })}>
      {children}
      <span className="sr-only"> — offre supérieure requise</span>
    </Button>
  );
}
