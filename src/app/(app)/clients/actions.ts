"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { canAddClient, getPlan } from "@/lib/plans";
import { clientSchema, formDataToObject, zodFieldErrors, type ActionState } from "@/lib/validation/schemas";

export type ClientActionState = ActionState & { id?: string };

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans quelques instants.";

export async function createClientAction(_prev: ClientActionState, formData: FormData): Promise<ClientActionState> {
  const session = await requireUser();
  const parsed = clientSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  // Vérification du quota côté serveur (la base l'applique aussi via trigger).
  const profile = await getProfile(session);
  const plan = getPlan(profile.plan);
  const { count } = await session.supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", session.user.id);
  if (!canAddClient(plan.id, count ?? 0)) {
    return {
      ok: false,
      message: `Votre offre ${plan.name} est limitée à ${plan.maxClients} clients. Passez à l'offre Pro pour en ajouter davantage.`,
    };
  }

  const { data, error } = await session.supabase
    .from("clients")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("CLIENT_LIMIT_REACHED")) {
      return { ok: false, message: "Limite de clients atteinte pour votre offre." };
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true, message: "Client ajouté.", id: data.id };
}

export async function updateClientAction(id: string, _prev: ClientActionState, formData: FormData): Promise<ClientActionState> {
  const session = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Client introuvable." };
  const parsed = clientSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { error, count } = await session.supabase
    .from("clients")
    .update(parsed.data, { count: "exact" })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return { ok: false, message: GENERIC_ERROR };
  if (count === 0) return { ok: false, message: "Client introuvable." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Client mis à jour.", id };
}

export async function deleteClientAction(id: string): Promise<ActionState> {
  const session = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Client introuvable." };

  const { error } = await session.supabase.from("clients").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  revalidatePath("/clients");
  revalidatePath("/devis");
  revalidatePath("/relances");
  revalidatePath("/dashboard");
  return { ok: true, message: "Client supprimé." };
}

/** Marque le client comme contacté aujourd'hui (depuis sa fiche). */
export async function markContactedAction(id: string): Promise<ActionState> {
  const session = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Client introuvable." };
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await session.supabase.from("clients").update({ last_contact_at: today }).eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  return { ok: true, message: "Dernier contact mis à jour." };
}
