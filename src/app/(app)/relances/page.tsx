import type { Metadata } from "next";
import { Suspense } from "react";
import { BellRing, AlertTriangle, CalendarCheck, CalendarDays, History, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchFilters } from "@/components/app/search-filters";
import { NewReminderButton, type ReminderClientOption, type ReminderQuoteOption } from "@/components/app/reminder-dialog";
import { ReminderItem, type ReminderRow } from "@/components/app/reminder-item";
import { createReminderAction } from "./actions";
import { REMINDER_CHANNELS, REMINDER_CHANNEL_LABELS } from "@/lib/validation/schemas";
import { classifyDueDate, formatDateTime, todayISO } from "@/lib/utils";
import type { ReminderChannel } from "@/lib/database.types";

export const metadata: Metadata = { title: "Relances" };

const SORTS = [
  { value: "asc", label: "Plus anciennes d'abord" },
  { value: "desc", label: "Plus récentes d'abord" },
];

type SectionProps = { title: string; icon: typeof BellRing; items: ReminderRow[]; tone: string; clients: ReminderClientOption[]; quotes: ReminderQuoteOption[]; googleShortcuts: boolean };

function Section({ title, icon: Icon, items, tone, clients, quotes, googleShortcuts }: SectionProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>
          <span className={`flex items-center gap-2 ${tone}`}>
            <Icon className="size-4" aria-hidden /> {title}
          </span>
        </CardTitle>
        <span className="text-xs text-fg-subtle">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-fg-subtle">Rien ici.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((r) => (
            <ReminderItem key={r.id} reminder={r} clients={clients} quotes={quotes} googleShortcuts={googleShortcuts} />
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function RemindersPage({ searchParams }: PageProps<"/relances">) {
  const session = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const canal = typeof params.canal === "string" && (REMINDER_CHANNELS as readonly string[]).includes(params.canal) ? (params.canal as ReminderChannel) : null;
  const tri = params.tri === "desc" ? "desc" : "asc";
  const showDone = params.vue === "terminees";

  let query = session.supabase
    .from("reminders")
    .select("*, client:clients(id, name, company), quote:quotes(id, title, amount)")
    .eq("user_id", session.user.id)
    .eq("status", showDone ? "terminee" : "a_faire")
    .order("due_at", { ascending: tri === "asc" });
  if (canal) query = query.eq("channel", canal);
  if (q) query = query.ilike("title", `%${q.replace(/[%,()]/g, " ")}%`);

  const [{ data, error }, { data: clients }, { data: quotes }, { data: events }, profile] = await Promise.all([
    query,
    session.supabase.from("clients").select("id, name, company").eq("user_id", session.user.id).order("name"),
    session.supabase.from("quotes").select("id, title, client_id").eq("user_id", session.user.id).order("created_at", { ascending: false }),
    session.supabase.from("reminder_events").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(15),
    getProfile(session),
  ]);
  const plan = getPlan(profile.plan);

  const reminders = (data ?? []) as unknown as ReminderRow[];
  const today = todayISO();
  const overdue = reminders.filter((r) => classifyDueDate(r.due_at, today) === "overdue");
  const dueToday = reminders.filter((r) => classifyDueDate(r.due_at, today) === "today");
  const upcoming = reminders.filter((r) => classifyDueDate(r.due_at, today) === "upcoming");
  const clientOptions = clients ?? [];
  const quoteOptions = quotes ?? [];

  return (
    <>
      <PageHeader
        icon={BellRing}
        title="Relances"
        description="Ce que vous avez à faire aujourd'hui, ce qui est en retard et ce qui arrive."
        actions={
          <Suspense>
            <NewReminderButton action={createReminderAction} clients={clientOptions} quotes={quoteOptions} />
          </Suspense>
        }
      />

      <Suspense>
        <SearchFilters
          placeholder="Rechercher une relance…"
          filters={[
            { name: "canal", label: "Tous les canaux", options: REMINDER_CHANNELS.map((c) => ({ value: c, label: REMINDER_CHANNEL_LABELS[c] })) },
            { name: "tri", label: "Tri par date", options: SORTS },
            {
              name: "vue",
              label: "À faire",
              options: [{ value: "terminees", label: "Terminées" }],
            },
          ]}
        />
      </Suspense>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          Impossible de charger vos relances. Rechargez la page.
        </p>
      ) : reminders.length === 0 && !q && !canal ? (
        <EmptyState
          icon={showDone ? CheckCircle2 : BellRing}
          title={showDone ? "Aucune relance terminée" : "Aucune relance planifiée"}
          description={showDone ? "Les relances terminées apparaîtront ici." : "Planifiez votre première relance : vous la retrouverez ici le jour J."}
        />
      ) : showDone ? (
        <Section title="Relances terminées" icon={CheckCircle2} items={reminders} tone="text-success" clients={clientOptions} quotes={quoteOptions} googleShortcuts={plan.googleShortcuts} />
      ) : (
        <div className="space-y-5">
          <Section title="Aujourd'hui" icon={CalendarCheck} items={dueToday} tone="text-warning" clients={clientOptions} quotes={quoteOptions} googleShortcuts={plan.googleShortcuts} />
          <Section title="En retard" icon={AlertTriangle} items={overdue} tone="text-danger" clients={clientOptions} quotes={quoteOptions} googleShortcuts={plan.googleShortcuts} />
          <Section title="À venir" icon={CalendarDays} items={upcoming} tone="text-info" clients={clientOptions} quotes={quoteOptions} googleShortcuts={plan.googleShortcuts} />
        </div>
      )}

      <Card className="mt-6">
        <CardTitle>
          <span className="flex items-center gap-2">
            <History className="size-4 text-fg-muted" aria-hidden /> Historique des actions
          </span>
        </CardTitle>
        {(events ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-fg-subtle">Aucune action enregistrée pour le moment.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {(events ?? []).map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-fg-muted">{e.details ?? e.action}</p>
                  <p className="text-xs text-fg-subtle">{formatDateTime(e.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
