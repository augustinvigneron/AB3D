import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-fg-muted">Le suivi client et les relances des artisans et indépendants, avec un coup de pouce de l'IA.</p>
        </div>
        <nav aria-label="Liens légaux" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-fg-muted">
          <Link href="/#fonctionnalites" className="hover:text-fg">
            Fonctionnalités
          </Link>
          <Link href="/mentions-legales" className="hover:text-fg">
            Mentions légales
          </Link>
          <Link href="/#tarifs" className="hover:text-fg">
            Tarifs
          </Link>
          <Link href="/confidentialite" className="hover:text-fg">
            Politique de confidentialité
          </Link>
          <Link href="/demo" className="hover:text-fg">
            Démonstration
          </Link>
          <Link href="/conditions-utilisation" className="hover:text-fg">
            Conditions d'utilisation
          </Link>
        </nav>
      </div>
      <p className="border-t border-border/60 py-4 text-center text-xs text-fg-subtle">© {new Date().getFullYear()} Relanceo AI. Tous droits réservés.</p>
    </footer>
  );
}
