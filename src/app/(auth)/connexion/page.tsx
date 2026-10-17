import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { Card } from "@/components/ui/card";
import { isGoogleAuthEnabled } from "@/lib/supabase/auth-settings";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const [params, googleEnabled] = await Promise.all([searchParams, isGoogleAuthEnabled()]);
  const rawNext = typeof params.next === "string" ? params.next : "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const errorMessage =
    params.erreur === "lien_invalide"
      ? "Ce lien est invalide ou a expiré. Connectez-vous ou refaites une demande."
      : params.erreur === "google"
        ? "La connexion avec Google n'a pas abouti. Réessayez, ou utilisez votre email."
        : null;

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-fg-muted">Heureux de vous revoir.</p>
      {errorMessage && (
        <p role="alert" className="mt-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
          {errorMessage}
        </p>
      )}
      <div className="mt-6">
        {googleEnabled && <GoogleButton next={next} />}
        <SignInForm next={next} />
      </div>
    </Card>
  );
}
