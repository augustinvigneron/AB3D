import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Mail, Phone, Building2, FileText, BellRing, Sparkles, Plus, CheckCheck } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ActionButton } from "@/components/app/action-button";
import { Badge } from "@/components/ui/badge";
import { ClientStatusBadge, QuoteStatusBadge } from "@/components/app/status-badge";
import { DeleteButton } from "@/components/app/delete-button";
import { deleteClientAction, markContactedAction } from "../actions";
import { classifyDueDate, formatDate, formatEuro, initials } from "@/lib/utils";
import { REMINDER_CHANNEL_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Fiche client" };

export default async function ClientDetailPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireUser();

  const [{ data: client }, { data: quotes }, { data: reminders }] = await Promise.all([
    session.supabase.from("clients").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle(),
    session.supabase.from("quotes").select("*").eq("client_id", id).eq("user_id", session.user.id).order("created_at", { ascending: false }),
    session.supabase.from("reminders").select("*").eq("client_id", id).eq("user_id", session.user.id).order("due_at", { ascending: true }),
  ]);
  if (!client) notFound();

  const due = classifyDueDate(client.next_followup_at);
  const deleteAction = deleteClientAction.bind(null, client.id);
  const markContacted = markContactedAction.bind(null, client.id);
  const openReminders = (reminders ?? []).filter((r) => r.status === "a_faire");
  const doneReminders = (reminders ?? []).filter((r) => r.status === "terminee");

  return (
    <>
      <PageHeader
        title={client.name}
        description={client.company ?? "Particulier"}
        actions={
          <>
            <LinkButton href={`/assistant?client=${encodeURIComponent(client.name)}`} variant="secondary">
              <Sparkles className="size-4 text-brand" />
              Rédiger une relance
            </LinkButton>
            <LinkButton href={`/clients/${client.id}/modifier`} variant="outline">
              <Pencil className="size-4" />
              Modifier
            </LinkButton>
            <DeleteButton
              action={deleteAction}
              title="Supprimer ce client ?"
              description={`${client.name} ainsi que ses devis et relances associés seront définitivement supprimés.`}
              redirectTo="/clients"
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-base font-bold text-[#c4b5ff]" aria-hidden>
              {initials(client.name)}
            </span>
            <div>
              <ClientStatusBadge status={client.status} />
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
              <dd>{client.company ?? <span className="text-fg-subtle">Pas d'entreprise</span>}</dd>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
              <dd className="break-all">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="link">
                    {client.email}
                  </a>
                ) : (
                  <span className="text-fg-subtle">Pas d'email</span>
                )}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
              <dd>
                {client.phone ? (
                  <a href={`tel:${client.phone.replace(/\s/g, "")}`} className="link">
                    {client.phone}
                  </a>
                ) : (
                  <span className="text-fg-subtle">Pas de téléphone</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-fg-muted">Dernier contact</dt>
              <dd>{formatDate(client.last_contact_at)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-fg-muted">Prochaine relance</dt>
              <dd>
                {client.next_followup_at ? (
                  <Badge tone={due === "overdue" ? "danger" : due === "today" ? "warning" : "neutral"}>{formatDate(client.next_followup_at)}</Badge>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </div>
          <ActionButton action={markContacted} className="mt-4 w-full">
            <CheckCheck className="size-4" />
            Contacté aujourd'hui
          </ActionButton>
          {client.notes && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-fg-muted">{client.notes}</p>
            </div>
          )}
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <FileText className="size-4 text-fg-muted" /> Devis
                </span>
              </CardTitle>
              <LinkButton href={`/devis/nouveau?client=${client.id}`} variant="ghost" size="sm">
                <Plus className="size-4" /> Nouveau devis
              </LinkButton>
            </div>
            {(quotes ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-fg-subtle">Aucun devis pour ce client.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {(quotes ?? []).map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/devis/${q.id}/modifier`} className="text-sm font-medium hover:underline">
                        {q.title}
                      </Link>
                      <p className="text-xs text-fg-subtle">Envoyé le {formatDate(q.sent_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">{formatEuro(Number(q.amount))}</span>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <BellRing className="size-4 text-fg-muted" /> Relances
                </span>
              </CardTitle>
              <LinkButton href={`/relances?nouvelle=1&client=${client.id}`} variant="ghost" size="sm">
                <Plus className="size-4" /> Planifier
              </LinkButton>
            </div>
            {openReminders.length === 0 && doneReminders.length === 0 ? (
              <p className="mt-3 text-sm text-fg-subtle">Aucune relance planifiée.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {[...openReminders, ...doneReminders].map((r) => {
                  const k = classifyDueDate(r.due_at);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className={r.status === "terminee" ? "text-sm text-fg-subtle line-through" : "text-sm font-medium"}>{r.title}</p>
                        <p className="text-xs text-fg-subtle">
                          {REMINDER_CHANNEL_LABELS[r.channel]} · {formatDate(r.due_at)}
                        </p>
                      </div>
                      {r.status === "terminee" ? (
                        <Badge tone="success">Terminée</Badge>
                      ) : (
                        <Badge tone={k === "overdue" ? "danger" : k === "today" ? "warning" : "neutral"}>
                          {k === "overdue" ? "En retard" : k === "today" ? "Aujourd'hui" : "À venir"}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
