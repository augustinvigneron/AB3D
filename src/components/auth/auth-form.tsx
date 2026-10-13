"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { initialActionState, type ActionState } from "@/lib/validation/schemas";
import { signIn, signUp, forgotPassword, resetPassword } from "@/app/(auth)/actions";

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={
        state.ok
          ? "flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm"
          : "flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm"
      }
    >
      {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />}
      <span>{state.message}</span>
    </div>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initialActionState);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Message state={state} />
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" error={errors.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe" name="password" error={errors.password} required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="text-right">
        <Link href="/mot-de-passe-oublie" className="text-xs text-fg-muted hover:text-fg">
          Mot de passe oublié ?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={pending}>
        Se connecter
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="link">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialActionState);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Message state={state} />
      <Field label="Votre nom" name="fullName" error={errors.fullName} required>
        <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Marie Dupont" />
      </Field>
      <Field label="Entreprise" name="companyName" error={errors.companyName} hint="Facultatif">
        <Input id="companyName" name="companyName" autoComplete="organization" placeholder="Dupont Plomberie" />
      </Field>
      <Field label="Email" name="email" error={errors.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe" name="password" error={errors.password} hint="8 caractères minimum" required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <p className="text-xs text-fg-subtle">
        En créant un compte, vous acceptez les{" "}
        <Link href="/conditions-utilisation" className="link">
          conditions d'utilisation
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" className="link">
          politique de confidentialité
        </Link>
        .
      </p>
      <Button type="submit" className="w-full" loading={pending}>
        Créer mon compte
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="link">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, initialActionState);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Message state={state} />
      <Field label="Email" name="email" error={errors.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Envoyer le lien
      </Button>
      <p className="text-center text-sm text-fg-muted">
        <Link href="/connexion" className="link">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialActionState);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Message state={state} />
      <Field label="Nouveau mot de passe" name="password" error={errors.password} required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Confirmer le mot de passe" name="confirm" error={errors.confirm} required>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Enregistrer le mot de passe
      </Button>
    </form>
  );
}
