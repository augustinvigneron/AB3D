import type { Metadata } from "next";
import Link from "next/link";
import { Users, UserPlus, BellRing, AlertTriangle, FileText, Euro, LayoutDashboard, CalendarClock, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/overview";
import { getProfile } from "@/lib/data/profile";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/app/stat-card";
import { LinkButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { classifyDueDate, formatDate, formatEuro } from "@/lib/utils";
import { REMINDER_CHANNEL_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await requireUser();
  const [{ stats, upcoming }, profile, params] = await Promise.all([getDashboardData(session), getProfile(session), searchParams]);
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <>
      {params.motdepasse === "ok" && (
        <p role="status" className="mb-4 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm">
          Votre mot de passe a été mis à jour.
        </p>
      )}
      <PageHeader
        icon={LayoutDashboard}
        title={firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        description="Voici l'état de votre activité commerciale."
        actions={
          <LinkButton href="/clients/nouveau">
            <UserPlus className="size-4" />
            Ajouter un client
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Clients" value={stats.totalClients} icon={Users} tone="brand" href="/clients" />
        <StatCard label="Prospects" value={stats.prospects} icon={UserPlus} tone="neutral" href="/clients?statut=prospect" />
        <StatCard label="Relances aujourd'hui" value={stats.remindersToday} icon={BellRing} tone="warning" href="/relances" />
        <StatCard label="Relances en retard" value={stats.remindersOverdue} icon={AlertTriangle} tone={stats.remindersOverdue > 0 ? "danger" : "neutral"} href="/relances" />
        <StatCard label="Devis en attente" value={stats.pendingQuotes} icon={FileText} tone="neutral" href="/devis?statut=en_attente" />
        <StatCard label="Montant en attente" value={formatEuro(stats.pendingQuotesAmount)} icon={Euro} tone="success" hint="Devis envoyés ou en attente" href="/devis" />
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <CardTitle>Prochaines actions</CardTitle>
          <Link href="/relances" className="flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
            Toutes les relances <ArrowRight className="size-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CalendarClock}
              title="Aucune relance planifiée"
              description="Ajoutez un client et planifiez votre première relance pour ne rien oublier."
              action={<LinkButton href="/relances?nouvelle=1" variant="secondary">Planifier une relance</LinkButton>}
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {upcoming.map((r) => {
              const kind = classifyDueDate(r.due_at);
              return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span
                    className={
                      kind === "overdue"
                        ? "size-2 shrink-0 rounded-full bg-danger"
                        : kind === "today"
                          ? "size-2 shrink-0 rounded-full bg-warning"
                          : "size-2 shrink-0 rounded-full bg-fg-subtle"
                    }
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {r.client ? (
                        <Link href={`/clients/${r.client.id}`} className="hover:text-fg">
                          {r.client.name}
                          {r.client.company ? ` · ${r.client.company}` : ""}
                        </Link>
                      ) : (
                        "Sans client"
                      )}{" "}
                      · {REMINDER_CHANNEL_LABELS[r.channel]}
                    </p>
                  </div>
                  <Badge tone={kind === "overdue" ? "danger" : kind === "today" ? "warning" : "neutral"}>
                    {kind === "overdue" ? "En retard" : kind === "today" ? "Aujourd'hui" : formatDate(r.due_at)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
