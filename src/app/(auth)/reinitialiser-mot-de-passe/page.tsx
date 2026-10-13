import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-fg-muted">Choisissez un mot de passe d'au moins 8 caractères.</p>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </Card>
  );
}
