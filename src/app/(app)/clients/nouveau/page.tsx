import type { Metadata } from "next";
import { Lock, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { PLANS, canAddClient, clientLimitFeature, getPlan, nextPlan } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/app/client-form";
import { UpgradeButton } from "@/components/app/upgrade-dialog";
import { createClientAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewClientPage() {
  const session = await requireUser();
  const [profile, { count }] = await Promise.all([
    getProfile(session),
    session.supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
  ]);
  const plan = getPlan(profile.plan);

  // Limite atteinte : on le dit avant que l'artisan remplisse le formulaire (l'action vérifie aussi côté serveur).
  if (!canAddClient(plan.id, count ?? 0)) {
    const target = nextPlan(plan.id) ?? "business";
    return (
      <>
        <PageHeader icon={UserPlus} title="Nouveau client" description={`Votre offre ${plan.name} est limitée à ${plan.maxClients} clients.`} />
        <Card className="max-w-3xl p-6">
          <p className="text-sm text-fg-muted">
            Vous avez atteint la limite de votre offre. Passez à l'offre {PLANS[target].name} pour ajouter de nouveaux clients : rien n'est supprimé.
          </p>
          <UpgradeButton feature={clientLimitFeature(target)} requiredPlan={target} className="mt-4">
            <Lock className="size-4" />
            Voir les offres
          </UpgradeButton>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader icon={UserPlus} title="Nouveau client" description="Seul le nom est obligatoire. Vous pourrez compléter la fiche plus tard." />
      <Card className="max-w-3xl p-6">
        <ClientForm action={createClientAction} cancelHref="/clients" />
      </Card>
    </>
  );
}


