import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Point d'arrivée des liens envoyés par Supabase (confirmation d'email,
 * réinitialisation de mot de passe). Deux formats sont acceptés :
 *  - ?code=…                      (flux PKCE, même navigateur que la demande)
 *  - ?token_hash=…&type=…         (recommandé : fonctionne depuis n'importe quel appareil ;
 *                                  voir README, section « Modèles d'email »)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/configuration-requise`);
  }

  // Échec ou annulation côté Google / Supabase (ex. l'utilisateur a refusé l'accès).
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/connexion?erreur=google`);
  }

  const supabase = await createClient();

  if (tokenHash && type && (OTP_TYPES as string[]).includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
    if (!error) {
      const target = type === "recovery" ? "/reinitialiser-mot-de-passe" : next;
      return NextResponse.redirect(`${origin}${target}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`);
}
