import type { Metadata } from "next";
import Link from "next/link";
import { Settings, User, SlidersHorizontal, Database, ShieldAlert, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile, parsePreferences } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm, PreferencesForm, DataSection, DeleteAccountSection } from "@/components/app/settings-forms";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const session = await requireUser();
  const profile = await getProfile(session);
  const plan = getPlan(profile.plan);

  return (
    <>
      <PageHeader icon={Settings} title="Paramètres" description="Votre profil, vos préférences et la gestion de vos données." />

      <div className="space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <User className="size-4 text-fg-muted" /> Profil
                </span>
              </CardTitle>
              <CardDescription>Connecté avec {session.user.email}.</CardDescription>
            </div>
            <Link href="/parametres/abonnement" className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
              <CreditCard className="size-4" />
              <Badge tone={plan.id === "free" ? "neutral" : "brand"}>Offre {plan.name}</Badge>
            </Link>
          </div>
          <div className="mt-5">
            <ProfileForm profile={profile} />
          </div>
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-fg-muted" /> Préférences d'affichage
            </span>
          </CardTitle>
          <div className="mt-5">
            <PreferencesForm preferences={parsePreferences(profile.preferences)} />
          </div>
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database className="size-4 text-fg-muted" /> Mes données personnelles
            </span>
          </CardTitle>
          <CardDescription>
            Vous pouvez consulter, exporter et supprimer vos données à tout moment. Consultez la{" "}
            <Link href="/confidentialite" className="link">
              politique de confidentialité
            </Link>
            .
          </CardDescription>
          <div className="mt-5">
            <DataSection />
          </div>
        </Card>

        <Card className="border-danger/30">
          <CardTitle>
            <span className="flex items-center gap-2 text-danger">
              <ShieldAlert className="size-4" /> Zone sensible
            </span>
          </CardTitle>
          <div className="mt-5">
            <DeleteAccountSection />
          </div>
        </Card>
      </div>
    </>
  );
}
