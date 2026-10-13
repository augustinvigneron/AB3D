import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Configuration requise" };

/** Affichée quand les variables Supabase ne sont pas renseignées. */
export default function ConfigurationRequisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="max-w-lg p-8 animate-rise">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Settings2 className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Supabase n'est pas encore configuré</h1>
          <p className="mt-2 text-sm text-fg-muted">
            L'authentification et la base de données reposent sur Supabase. Pour activer l'application :
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-fg-muted">
            <li>Créez un projet gratuit sur supabase.com.</li>
            <li>
              Exécutez le fichier <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">supabase/migrations/0001_init.sql</code> dans
              l'éditeur SQL.
            </li>
            <li>
              Copiez <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">.env.example</code> vers{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">.env.local</code> et renseignez l'URL et la clé publique.
            </li>
            <li>Redémarrez le serveur de développement.</li>
          </ol>
          <p className="mt-4 text-sm text-fg-muted">Le README du projet détaille chaque étape.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkButton href="/demo" variant="primary">
              Voir la démonstration
            </LinkButton>
            <Link href="/" className="inline-flex h-10 items-center px-3 text-sm text-fg-muted hover:text-fg">
              Retour à l'accueil
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
