"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formDataToObject, preferencesSchema, profileSchema, zodFieldErrors, type ActionState } from "@/lib/validation/schemas";

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans quelques instants.";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { error } = await session.supabase.from("profiles").update(parsed.data).eq("id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function updatePreferencesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const raw = formDataToObject(formData);
  const parsed = preferencesSchema.safeParse({
    compact_mode: raw.compact_mode === "on",
    week_start: raw.week_start,
    default_reminder_delay: raw.default_reminder_delay,
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { error } = await session.supabase.from("profiles").update({ preferences: parsed.data }).eq("id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  revalidatePath("/parametres");
  return { ok: true, message: "Préférences enregistrées." };
}

/** Supprime définitivement le compte et toutes ses données (RPC sécurisée côté base). */
export async function deleteAccountAction(confirmation: string): Promise<ActionState> {
  const session = await requireUser();
  if (confirmation.trim().toUpperCase() !== "SUPPRIMER") {
    return { ok: false, message: "Tapez SUPPRIMER pour confirmer." };
  }
  const { error } = await session.supabase.rpc("delete_own_account");
  if (error) return { ok: false, message: "Suppression impossible pour le moment. Contactez le support." };

  await session.supabase.auth.signOut();
  redirect("/?compte=supprime");
}
