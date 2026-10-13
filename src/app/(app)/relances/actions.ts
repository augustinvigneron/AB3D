"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, type Session } from "@/lib/auth";
import { formDataToObject, reminderSchema, zodFieldErrors, type ActionState } from "@/lib/validation/schemas";
import type { ReminderEvent } from "@/lib/database.types";

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans quelques instants.";
const uuid = z.string().uuid();

function revalidateReminders(clientId?: string | null) {
  revalidatePath("/relances");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

async function logEvent(session: Session, reminderId: string | null, action: ReminderEvent["action"], details: string) {
  // L'historique est informatif : une erreur ici ne doit pas bloquer l'action principale.
  await session.supabase.from("reminder_events").insert({ user_id: session.user.id, reminder_id: reminderId, action, details: details.slice(0, 500) });
}

export async function createReminderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const parsed = reminderSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { data, error } = await session.supabase
    .from("reminders")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("NOT_OWNED")) return { ok: false, message: "Client ou devis invalide." };
    return { ok: false, message: GENERIC_ERROR };
  }

  await logEvent(session, data.id, "creee", `Relance « ${parsed.data.title} » planifiée pour le ${parsed.data.due_at}`);
  revalidateReminders(parsed.data.client_id);
  return { ok: true, message: "Relance planifiée." };
}

export async function updateReminderAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Relance introuvable." };
  const parsed = reminderSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { error, count } = await session.supabase.from("reminders").update(parsed.data, { count: "exact" }).eq("id", id).eq("user_id", session.user.id);
  if (error) {
    if (error.message.includes("NOT_OWNED")) return { ok: false, message: "Client ou devis invalide." };
    return { ok: false, message: GENERIC_ERROR };
  }
  if (count === 0) return { ok: false, message: "Relance introuvable." };

  await logEvent(session, id, "modifiee", `Relance « ${parsed.data.title} » modifiée (échéance ${parsed.data.due_at})`);
  revalidateReminders(parsed.data.client_id);
  return { ok: true, message: "Relance mise à jour." };
}

export async function toggleReminderAction(id: string, done: boolean): Promise<ActionState> {
  const session = await requireUser();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Relance introuvable." };

  const { data: existing } = await session.supabase.from("reminders").select("title, client_id").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  if (!existing) return { ok: false, message: "Relance introuvable." };

  const { error } = await session.supabase
    .from("reminders")
    .update({ status: done ? "terminee" : "a_faire", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  if (done && existing.client_id) {
    // Terminer une relance met à jour la date de dernier contact du client.
    await session.supabase.from("clients").update({ last_contact_at: new Date().toISOString().slice(0, 10) }).eq("id", existing.client_id).eq("user_id", session.user.id);
    revalidatePath("/clients");
  }

  await logEvent(session, id, done ? "terminee" : "reouverte", `Relance « ${existing.title} » ${done ? "terminée" : "rouverte"}`);
  revalidateReminders(existing.client_id);
  return { ok: true, message: done ? "Relance terminée." : "Relance rouverte." };
}

export async function deleteReminderAction(id: string): Promise<ActionState> {
  const session = await requireUser();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Relance introuvable." };

  const { data: existing } = await session.supabase.from("reminders").select("title, client_id").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  const { error } = await session.supabase.from("reminders").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  if (existing) await logEvent(session, null, "supprimee", `Relance « ${existing.title} » supprimée`);
  revalidateReminders(existing?.client_id);
  return { ok: true, message: "Relance supprimée." };
}
