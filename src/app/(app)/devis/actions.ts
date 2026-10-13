"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { formDataToObject, quoteSchema, zodFieldErrors, type ActionState } from "@/lib/validation/schemas";

export type QuoteActionState = ActionState & { id?: string };

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans quelques instants.";

function revalidateQuotes(clientId?: string | null) {
  revalidatePath("/devis");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createQuoteAction(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const session = await requireUser();
  const parsed = quoteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { data, error } = await session.supabase
    .from("quotes")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("CLIENT_NOT_OWNED")) return { ok: false, errors: { client_id: ["Client invalide."] } };
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateQuotes(parsed.data.client_id);
  return { ok: true, message: "Devis enregistré.", id: data.id };
}

export async function updateQuoteAction(id: string, _prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const session = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Devis introuvable." };
  const parsed = quoteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { error, count } = await session.supabase.from("quotes").update(parsed.data, { count: "exact" }).eq("id", id).eq("user_id", session.user.id);
  if (error) {
    if (error.message.includes("CLIENT_NOT_OWNED")) return { ok: false, errors: { client_id: ["Client invalide."] } };
    return { ok: false, message: GENERIC_ERROR };
  }
  if (count === 0) return { ok: false, message: "Devis introuvable." };

  revalidateQuotes(parsed.data.client_id);
  return { ok: true, message: "Devis mis à jour.", id };
}

export async function deleteQuoteAction(id: string): Promise<ActionState> {
  const session = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Devis introuvable." };

  const { data } = await session.supabase.from("quotes").select("client_id").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  const { error } = await session.supabase.from("quotes").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return { ok: false, message: GENERIC_ERROR };

  revalidateQuotes(data?.client_id);
  revalidatePath("/relances");
  return { ok: true, message: "Devis supprimé." };
}
