import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav aria-label="Navigation du site" className="hidden items-center gap-6 text-sm text-fg-muted md:flex">
          <Link href="/#fonctionnalites" className="hover:text-fg">
            Fonctionnalités
          </Link>
          <Link href="/#tarifs" className="hover:text-fg">
            Tarifs
          </Link>
          <Link href="/#faq" className="hover:text-fg">
            FAQ
          </Link>
          <Link href="/demo" className="hover:text-fg">
            Démo
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/connexion" className="hidden px-3 text-sm text-fg-muted hover:text-fg sm:block">
            Connexion
          </Link>
          <LinkButton href="/inscription" size="sm">
            Essayer gratuitement
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
