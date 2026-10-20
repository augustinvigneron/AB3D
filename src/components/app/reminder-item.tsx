"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw, Mail, Phone, MessageSquare, MapPin, MoreHorizontal, Sparkles, CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/google-links";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DeleteButton } from "./delete-button";
import { ReminderDialog, type ReminderClientOption, type ReminderQuoteOption } from "./reminder-dialog";
import { deleteReminderAction, toggleReminderAction, updateReminderAction } from "@/app/(app)/relances/actions";
import { classifyDueDate, formatDate, cn } from "@/lib/utils";
import { REMINDER_CHANNEL_LABELS } from "@/lib/validation/schemas";
import type { Reminder, ReminderChannel } from "@/lib/database.types";

export type ReminderRow = Reminder & {
  client: { id: string; name: string; company: string | null } | null;
  quote: { id: string; title: string; amount: number } | null;
};

const channelIcons: Record<ReminderChannel, typeof Mail> = {
  email: Mail,
  telephone: Phone,
  sms: MessageSquare,
  visite: MapPin,
  autre: MoreHorizontal,
};

type ReminderItemProps = {
  reminder: ReminderRow;
  clients: ReminderClientOption[];
  quotes: ReminderQuoteOption[];
  /** Offre Business : bouton « Ajouter à Google Agenda ». */
  googleShortcuts?: boolean;
};

export function ReminderItem({ reminder, clients, quotes, googleShortcuts = false }: ReminderItemProps) {
  const [editing, setEditing] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const done = reminder.status === "terminee";
  const kind = classifyDueDate(reminder.due_at);
  const Icon = channelIcons[reminder.channel];

  const toggle = () => {
    startTransition(async () => {
      const res = await toggleReminderAction(reminder.id, !done);
      toast(res.message ?? "", res.ok ? "success" : "error");
      if (res.ok) router.refresh();
    });
  };

  return (
    <li className={cn("flex items-start gap-3 py-3 animate-fade-in", done && "opacity-70")}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={done ? `Rouvrir la relance ${reminder.title}` : `Marquer la relance ${reminder.title} comme terminée`}
        aria-pressed={done}
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          done ? "border-success bg-success text-bg" : "border-border-strong hover:border-brand hover:text-brand",
        )}
      >
        {done ? <Check className="size-3.5" /> : <span className="sr-only">À faire</span>}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", done && "line-through")}>{reminder.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-subtle">
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3" aria-hidden /> {REMINDER_CHANNEL_LABELS[reminder.channel]}
          </span>
          {reminder.client && (
            <>
              <span aria-hidden>·</span>
              <Link href={`/clients/${reminder.client.id}`} className="hover:text-fg">
                {reminder.client.name}
              </Link>
            </>
          )}
          {reminder.quote && (
            <>
              <span aria-hidden>·</span>
              <span>Devis : {reminder.quote.title}</span>
            </>
          )}
        </p>
        {reminder.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-fg-muted">{reminder.notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {done ? (
          <Badge tone="success">Terminée</Badge>
        ) : (
          <Badge tone={kind === "overdue" ? "danger" : kind === "today" ? "warning" : "neutral"}>
            {kind === "overdue" ? `En retard · ${formatDate(reminder.due_at)}` : kind === "today" ? "Aujourd'hui" : formatDate(reminder.due_at)}
          </Badge>
        )}
        {!done && reminder.client && (
          <Link
            href={`/assistant?client=${encodeURIComponent(reminder.client.name)}${reminder.quote ? `&devis=${reminder.quote.id}` : ""}`}
            className="hidden rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg sm:block"
            aria-label="Rédiger le message avec l'assistant"
            title="Rédiger le message"
          >
            <Sparkles className="size-4 text-brand" />
          </Link>
        )}
        {!done &&
          (googleShortcuts ? (
            <a
              href={googleCalendarUrl({
                title: reminder.client ? `${reminder.title} — ${reminder.client.name}` : reminder.title,
                date: reminder.due_at,
                details: [`Relance (${REMINDER_CHANNEL_LABELS[reminder.channel]})`, reminder.quote ? `Devis : ${reminder.quote.title}` : "", reminder.notes ?? ""]
                  .filter(Boolean)
                  .join("\n"),
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg sm:block"
              aria-label="Ajouter à Google Agenda"
              title="Ajouter à Google Agenda"
            >
              <CalendarPlus className="size-4" />
            </a>
          ) : (
            <Link
              href="/parametres/abonnement"
              className="hidden rounded-lg p-2 text-fg-subtle opacity-60 hover:bg-surface-2 hover:opacity-100 sm:block"
              aria-label="Ajouter à Google Agenda : disponible avec l'offre Business"
              title="Ajouter à Google Agenda — offre Business"
            >
              <CalendarPlus className="size-4" />
            </Link>
          ))}
        {done ? (
          <button type="button" onClick={toggle} disabled={pending} className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Rouvrir">
            <RotateCcw className="size-4" />
          </button>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Modifier">
            <Pencil className="size-4" />
          </button>
        )}
        <DeleteButton
          action={deleteReminderAction.bind(null, reminder.id)}
          title="Supprimer cette relance ?"
          description={`La relance « ${reminder.title} » sera définitivement supprimée.`}
          iconOnly
          size="sm"
        />
      </div>

      <ReminderDialog
        key={editKey}
        open={editing}
        onClose={() => {
          setEditing(false);
          setEditKey((k) => k + 1);
        }}
        action={updateReminderAction.bind(null, reminder.id)}
        reminder={reminder}
        clients={clients}
        quotes={quotes}
      />
    </li>
  );
}
