import type { Session } from "@/lib/auth";
import type { Profile } from "@/lib/database.types";
import { preferencesSchema, type Preferences } from "@/lib/validation/schemas";

export async function getProfile({ supabase, user }: Session): Promise<Profile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  // Le trigger crée le profil à l'inscription ; on prévoit tout de même un repli.
  return (
    data ?? {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      company_name: (user.user_metadata?.company_name as string | undefined) ?? null,
      plan: "free",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      current_period_end: null,
      preferences: {},
      created_at: user.created_at,
      updated_at: user.created_at,
    }
  );
}

export function parsePreferences(raw: unknown): Preferences {
  const parsed = preferencesSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : preferencesSchema.parse({});
}
