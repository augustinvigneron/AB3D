import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Users, UserPlus, Mail, Phone, Building2, CalendarClock, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { canAddClient, clientLimitFeature, getPlan, nextPlan } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { UpgradeButton } from "@/components/app/upgrade-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "@/components/app/search-filters";
import { ClientStatusBadge } from "@/components/app/status-badge";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from "@/lib/validation/schemas";
import { classifyDueDate, formatDate, initials } from "@/lib/utils";
import type { ClientStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const session = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statut = typeof params.statut === "string" && (CLIENT_STATUSES as readonly string[]).includes(params.statut) ? (params.statut as ClientStatus) : null;

  let query = session.supabase.from("clients").select("*").eq("user_id", session.user.id).order("name", { ascending: true });
  if (statut) query = query.eq("status", statut);
  if (q) {
    // Échappement minimal des caractères spéciaux du filtre PostgREST.
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const [{ data: clients, error }, profile, { count: total }] = await Promise.all([
    query,
    getProfile(session),
    session.supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
  ]);
  const plan = getPlan(profile.plan);
  const list = clients ?? [];
  const hasFilters = Boolean(q || statut);

  return (
    <>
      <PageHeader
        icon={Users}
        title="Mes clients"
        description={
          plan.maxClients
            ? `${total ?? 0} / ${plan.maxClients} clients sur votre offre ${plan.name}.`
            : `${total ?? 0} client${(total ?? 0) > 1 ? "s" : ""} dans votre portefeuille.`
        }
        actions={
          canAddClient(plan.id, total ?? 0) ? (
            <LinkButton href="/clients/nouveau">
              <UserPlus className="size-4" />
              Nouveau client
            </LinkButton>
          ) : (
            <UpgradeButton
              feature={clientLimitFeature(nextPlan(plan.id) ?? "business")}
              requiredPlan={nextPlan(plan.id) ?? "business"}
              title={`Limite de ${plan.maxClients} clients atteinte sur l'offre ${plan.name}`}
            >
              <Lock className="size-4" />
              Nouveau client
            </UpgradeButton>
          )
        }
      />

      <Suspense>
        <SearchFilters
          placeholder="Rechercher par nom, entreprise, email…"
          filters={[{ name: "statut", label: "Tous les statuts", options: CLIENT_STATUSES.map((s) => ({ value: s, label: CLIENT_STATUS_LABELS[s] })) }]}
        />
      </Suspense>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          Impossible de charger vos clients. Rechargez la page.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "Aucun client ne correspond" : "Aucun client pour le moment"}
          description={hasFilters ? "Modifiez votre recherche ou vos filtres." : "Ajoutez votre premier client pour commencer à suivre vos relances."}
          action={
            hasFilters ? (
              <LinkButton href="/clients" variant="secondary">
                Réinitialiser les filtres
              </LinkButton>
            ) : (
              <LinkButton href="/clients/nouveau">
                <UserPlus className="size-4" />
                Ajouter un client
              </LinkButton>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const due = classifyDueDate(c.next_followup_at);
            return (
              <li key={c.id} className="card group relative flex flex-col p-5 transition-colors hover:border-border-strong animate-rise">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-[#c4b5ff]" aria-hidden>
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/clients/${c.id}`} className="font-semibold after:absolute after:inset-0 after:content-['']">
                      {c.name}
                    </Link>
                    <p className="flex items-center gap-1 truncate text-xs text-fg-muted">
                      <Building2 className="size-3" aria-hidden />
                      {c.company ?? "Particulier"}
                    </p>
                  </div>
                  <ClientStatusBadge status={c.status} />
                </div>
                <dl className="mt-4 space-y-1.5 text-sm text-fg-muted">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                      <dd className="truncate">{c.email}</dd>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                      <dd>{c.phone}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-fg-subtle">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" aria-hidden />
                    Dernier contact : {formatDate(c.last_contact_at)}
                  </span>
                  {c.next_followup_at && (
                    <Badge tone={due === "overdue" ? "danger" : due === "today" ? "warning" : "neutral"}>
                      {due === "overdue" ? "Relance en retard" : due === "today" ? "À relancer aujourd'hui" : `Relance ${formatDate(c.next_followup_at)}`}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
