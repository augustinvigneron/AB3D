"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  forgotPasswordSchema,
  formDataToObject,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  zodFieldErrors,
  type ActionState,
} from "@/lib/validation/schemas";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Empêche une redirection ouverte vers un site tiers via ?next=. */
function safeNext(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

const NOT_CONFIGURED: ActionState = {
  ok: false,
  message: "Supabase n'est pas configuré sur ce serveur (voir le fichier .env.example).",
};

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = signUpSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
      data: { full_name: parsed.data.fullName, company_name: parsed.data.companyName ?? "" },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, message: "Un compte existe déjà avec cette adresse email." };
    }
    return { ok: false, message: "Inscription impossible pour le moment. Réessayez dans quelques instants." };
  }

  // Si la confirmation d'email est désactivée dans Supabase, la session est déjà ouverte.
  if (data.session) redirect("/dashboard");

  return {
    ok: true,
    message: "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
  };
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const raw = formDataToObject(formData);
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, message: "Votre adresse email n'est pas encore confirmée. Vérifiez votre boîte mail." };
    }
    return { ok: false, message: "Email ou mot de passe incorrect." };
  }

  redirect(safeNext(raw.next));
}

/**
 * Connexion / inscription avec Google (OAuth via Supabase).
 * Le même bouton sert aux deux : Supabase crée le compte à la première connexion.
 * Retour sur /auth/callback, qui échange le code contre une session.
 */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/configuration-requise");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) redirect("/connexion?erreur=google");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = forgotPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });

  // Réponse identique que l'adresse existe ou non : on n'indique pas quels emails ont un compte.
  return {
    ok: true,
    message: "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé.",
  };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Le lien de réinitialisation est invalide ou a expiré. Refaites une demande." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: "Impossible de mettre à jour le mot de passe. Réessayez." };
  }
  redirect("/dashboard?motdepasse=ok");
}
