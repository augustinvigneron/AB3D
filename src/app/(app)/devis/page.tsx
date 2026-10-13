import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileText, Plus, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "@/components/app/search-filters";
import { QuoteStatusBadge } from "@/components/app/status-badge";
import { DeleteButton } from "@/components/app/delete-button";
import { deleteQuoteAction } from "./actions";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/validation/schemas";
import { classifyDueDate, formatDate, formatEuro } from "@/lib/utils";
import type { Quote, QuoteStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Devis" };

type QuoteRow = Quote & { client: { id: string; name: string; company: string | null } | null };

export default async function QuotesPage({ searchParams }: PageProps<"/devis">) {
  const session = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statut = typeof params.statut === "string" && (QUOTE_STATUSES as readonly string[]).includes(params.statut) ? (params.statut as QuoteStatus) : null;

  let query = session.supabase
    .from("quotes")
    .select("*, client:clients(id, name, company)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (statut) query = query.eq("status", statut);
  if (q) query = query.ilike("title", `%${q.replace(/[%,()]/g, " ")}%`);

  const { data, error } = await query;
  const quotes = (data ?? []) as unknown as QuoteRow[];
  const hasFilters = Boolean(q || statut);

  const pending = quotes.filter((x) => x.status === "envoye" || x.status === "en_attente");
  const pendingAmount = pending.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Devis"
        description={`${pending.length} devis en attente de réponse, soit ${formatEuro(pendingAmount)}.`}
        actions={
          <LinkButton href="/devis/nouveau">
            <Plus className="size-4" />
            Nouveau devis
          </LinkButton>
        }
      />

      <Suspense>
        <SearchFilters
          placeholder="Rechercher un devis par titre…"
          filters={[{ name: "statut", label: "Tous les statuts", options: QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABELS[s] })) }]}
        />
      </Suspense>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          Impossible de charger vos devis. Rechargez la page.
        </p>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "Aucun devis ne correspond" : "Aucun devis pour le moment"}
          description={hasFilters ? "Modifiez votre recherche ou vos filtres." : "Enregistrez vos devis envoyés pour suivre les réponses et planifier vos relances."}
          action={
            hasFilters ? (
              <LinkButton href="/devis" variant="secondary">
                Réinitialiser les filtres
              </LinkButton>
            ) : (
              <LinkButton href="/devis/nouveau">
                <Plus className="size-4" /> Créer un devis
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="hidden bg-surface-2/60 text-left text-xs uppercase tracking-wide text-fg-subtle md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Devis</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Envoyé le</th>
                <th className="px-4 py-3 font-medium">Relance</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((x) => {
                const due = classifyDueDate(x.next_followup_at);
                return (
                  <tr key={x.id} className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 md:table-row md:px-0 md:py-0">
                    <td className="col-span-2 font-medium md:px-4 md:py-3">
                      <Link href={`/devis/${x.id}/modifier`} className="hover:underline">
                        {x.title}
                      </Link>
                    </td>
                    <td className="text-fg-muted md:px-4 md:py-3">
                      {x.client ? (
                        <Link href={`/clients/${x.client.id}`} className="hover:text-fg">
                          {x.client.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-fg-muted md:px-4 md:py-3">{formatDate(x.sent_at)}</td>
                    <td className="md:px-4 md:py-3">
                      {x.next_followup_at ? (
                        <Badge tone={due === "overdue" ? "danger" : due === "today" ? "warning" : "neutral"}>{formatDate(x.next_followup_at)}</Badge>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="font-semibold tabular-nums md:px-4 md:py-3 md:text-right">{formatEuro(Number(x.amount))}</td>
                    <td className="md:px-4 md:py-3">
                      <QuoteStatusBadge status={x.status} />
                    </td>
                    <td className="col-span-2 flex justify-end gap-1 md:px-4 md:py-3">
                      <Link href={`/devis/${x.id}/modifier`} className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label={`Modifier ${x.title}`}>
                        <Pencil className="size-4" />
                      </Link>
                      <DeleteButton
                        action={deleteQuoteAction.bind(null, x.id)}
                        title="Supprimer ce devis ?"
                        description={`Le devis « ${x.title} » sera définitivement supprimé.`}
                        iconOnly
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
