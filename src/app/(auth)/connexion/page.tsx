import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const linkError = params.erreur === "lien_invalide";

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-fg-muted">Heureux de vous revoir.</p>
      {linkError && (
        <p role="alert" className="mt-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
          Ce lien est invalide ou a expiré. Connectez-vous ou refaites une demande.
        </p>
      )}
      <div className="mt-6">
        <SignInForm next={next} />
      </div>
    </Card>
  );
}
