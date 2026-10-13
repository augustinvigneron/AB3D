import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16 text-center">
        <p className="text-6xl font-bold text-brand">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page introuvable</h1>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">Cette page n'existe pas ou a été déplacée.</p>
        <div className="mt-6 flex gap-3">
          <LinkButton href="/dashboard">Tableau de bord</LinkButton>
          <Link href="/" className="inline-flex h-10 items-center px-3 text-sm text-fg-muted hover:text-fg">
            Accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
