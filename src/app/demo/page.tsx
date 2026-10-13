// Les dates de démo sont relatives à aujourd'hui : rendu à la demande, pas figé au build.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Users, UserPlus, BellRing, AlertTriangle, FileText, Euro, FlaskConical, Sparkles, CalendarCheck, CalendarDays } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/app/stat-card";
import { ClientStatusBadge, QuoteStatusBadge } from "@/components/app/status-badge";
import { computeStats } from "@/lib/data/overview";
import { DEMO_CLIENTS, DEMO_QUOTES, DEMO_REMINDERS, demoClientById } from "@/lib/demo-data";
import { simulateVariants } from "@/lib/ai/simulation";
import { classifyDueDate, formatDate, formatEuro, initials } from "@/lib/utils";
import { REMINDER_CHANNEL_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Démonstration", robots: { index: false } };

/**
 * Mode démonstration : données fictives en lecture seule, sans compte ni base.
 * Permet de voir l'interface avant d'installer Supabase.
 */
export default function DemoPage() {
  const stats = computeStats(DEMO_CLIENTS, DEMO_QUOTES, DEMO_REMINDERS);
  const open = DEMO_REMINDERS.filter((r) => r.status === "a_faire");
  const variants = simulateVariants({
    clientName: "Camille Rousseau",
    context: "Visite en boutique il y a 9 jours, intéressée mais hésite sur le budget",
    messageType: "relance_devis",
    tone: "professionnel",
    quoteInfo: "Vitrine réfrigérée + pose, 4 800 €, envoyé il y a 9 jours",
    senderName: "Vous",
    companyName: "Votre entreprise",
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden text-sm text-fg-muted hover:text-fg sm:block">
              Accueil
            </Link>
            <LinkButton href="/inscription" size="sm">
              Créer mon compte
            </LinkButton>
          </div>
        </div>
      </header>

      <div className="border-b border-warning/30 bg-warning-soft">
        <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-sm sm:items-center sm:px-6">
          <FlaskConical className="size-4 shrink-0 text-warning" />
          <strong>Mode démonstration.</strong> Toutes ces données sont fictives et en lecture seule. Rien n'est enregistré.
        </p>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord (démo)</h1>
          <p className="mt-1 text-sm text-fg-muted">Ce que vous verriez chaque matin avec vos propres données.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Clients" value={stats.totalClients} icon={Users} tone="brand" />
          <StatCard label="Prospects" value={stats.prospects} icon={UserPlus} />
          <StatCard label="Relances aujourd'hui" value={stats.remindersToday} icon={BellRing} tone="warning" />
          <StatCard label="Relances en retard" value={stats.remindersOverdue} icon={AlertTriangle} tone="danger" />
          <StatCard label="Devis en attente" value={stats.pendingQuotes} icon={FileText} />
          <StatCard label="Montant en attente" value={formatEuro(stats.pendingQuotesAmount)} icon={Euro} tone="success" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BellRing className="size-4 text-fg-muted" /> Relances à faire
              </span>
            </CardTitle>
            <ul className="mt-3 divide-y divide-border">
              {open.map((r) => {
                const kind = classifyDueDate(r.due_at);
                const c = demoClientById(r.client_id);
                const Icon = kind === "overdue" ? AlertTriangle : kind === "today" ? CalendarCheck : CalendarDays;
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <Icon className={`size-4 shrink-0 ${kind === "overdue" ? "text-danger" : kind === "today" ? "text-warning" : "text-info"}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-fg-subtle">
                        {c?.name} · {REMINDER_CHANNEL_LABELS[r.channel]}
                      </p>
                    </div>
                    <Badge tone={kind === "overdue" ? "danger" : kind === "today" ? "warning" : "neutral"}>
                      {kind === "overdue" ? "En retard" : kind === "today" ? "Aujourd'hui" : formatDate(r.due_at)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-fg-muted" /> Devis
              </span>
            </CardTitle>
            <ul className="mt-3 divide-y divide-border">
              {DEMO_QUOTES.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{q.title}</p>
                    <p className="text-xs text-fg-subtle">{demoClientById(q.client_id)?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">{formatEuro(q.amount)}</span>
                    <QuoteStatusBadge status={q.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Clients</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DEMO_CLIENTS.map((c) => (
              <li key={c.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-[#c4b5ff]" aria-hidden>
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-fg-muted">{c.company ?? "Particulier"}</p>
                  </div>
                  <ClientStatusBadge status={c.status} />
                </div>
                <p className="mt-4 border-t border-border pt-3 text-xs text-fg-subtle">Dernier contact : {formatDate(c.last_contact_at)}</p>
              </li>
            ))}
          </ul>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" /> Assistant IA — exemple
              </span>
            </CardTitle>
            <Badge tone="warning">
              <FlaskConical className="size-3" /> Simulation locale, sans modèle d'IA
            </Badge>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            Pour « Camille Rousseau », relance de devis (vitrine réfrigérée, 4 800 €). Avec une clé d'API configurée, un vrai modèle rédige ces messages.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {variants.map((v) => (
              <div key={v.style} className="rounded-lg bg-bg-elevated p-4 text-sm">
                <Badge tone="brand" className="mb-2">
                  {v.label}
                </Badge>
                <p className="mb-2 text-xs font-medium text-fg-muted">Objet : {v.subject}</p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-fg-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="text-xl font-bold">Prêt à suivre vos vrais clients ?</h2>
          <p className="max-w-md text-sm text-fg-muted">Créez un compte gratuit : jusqu'à 10 clients et 5 générations IA par mois, sans carte bancaire.</p>
          <LinkButton href="/inscription" size="lg">
            Essayer gratuitement
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
