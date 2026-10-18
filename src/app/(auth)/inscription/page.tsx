import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/auth-form";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Card } from "@/components/ui/card";
import { isGoogleAuthEnabled } from "@/lib/supabase/auth-settings";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage() {
  const googleEnabled = await isGoogleAuthEnabled();
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <p className="mt-1 text-sm text-fg-muted">Gratuit, sans carte bancaire. Jusqu'à 10 clients.</p>
      <div className="mt-6">
        <GoogleSignIn enabled={googleEnabled} />
        <SignUpForm />
      </div>
    </Card>
  );
}
