"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BellRing,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import type { Plan } from "@/lib/plans";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/devis", label: "Devis", icon: FileText },
  { href: "/relances", label: "Relances", icon: BellRing },
  { href: "/assistant", label: "Assistant IA", icon: Sparkles },
] as const;

const SECONDARY = [
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/parametres/abonnement", label: "Abonnement", icon: CreditCard },
] as const;

type AppShellProps = {
  userName: string;
  userEmail: string;
  plan: Plan;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

export function AppShell({ userName, userEmail, plan, signOutAction, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/parametres" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <>
      <nav aria-label="Navigation principale" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href) ? "bg-brand-soft text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className={cn("size-4", isActive(href) ? "text-brand" : "")} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Compte</p>
          <ul className="space-y-1">
            {SECONDARY.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(href) ? "bg-brand-soft text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className={cn("size-4", isActive(href) ? "text-brand" : "")} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-[#c4b5ff]" aria-hidden>
            {initials(userName || userEmail)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName || userEmail}</p>
            <div className="flex items-center gap-2">
              <p className="truncate text-xs text-fg-subtle">{userEmail}</p>
            </div>
          </div>
          <Badge tone={plan.id === "free" ? "neutral" : "brand"}>{plan.name}</Badge>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="size-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar ordinateur */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-elevated/60 backdrop-blur lg:flex">
        <div className="px-5 py-5">
          <Logo href="/dashboard" />
        </div>
        {nav}
      </aside>

      {/* Barre mobile */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
          <Logo href="/dashboard" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
            <div id="mobile-nav" className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-border bg-bg-elevated animate-fade-in">
              <div className="flex items-center justify-between px-5 py-5">
                <Logo href="/dashboard" />
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-fg-muted hover:text-fg" aria-label="Fermer le menu">
                  <X className="size-5" />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
