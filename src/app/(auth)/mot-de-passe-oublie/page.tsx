import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-fg-muted">Nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </Card>
  );
}
