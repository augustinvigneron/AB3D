import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Préfixes d'URL réservés aux utilisateurs connectés. */
const PROTECTED_PREFIXES = ["/dashboard", "/clients", "/devis", "/relances", "/assistant", "/parametres"];
/** Pages d'auth : un utilisateur déjà connecté est renvoyé vers le tableau de bord. */
const AUTH_PAGES = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

/**
 * Proxy Next.js (ex-middleware) : rafraîchit la session Supabase à chaque
 * navigation et protège les pages privées. Les Server Components et Actions
 * revérifient de toute façon l'utilisateur côté serveur.
 */
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!env) {
    // Sans configuration Supabase, les pages privées renvoient vers une page explicative.
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/configuration-requise";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Ne pas insérer de logique entre createServerClient et getUser :
  // c'est cet appel qui rafraîchit le jeton et réécrit les cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images optimisées.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
