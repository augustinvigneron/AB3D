"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { REMINDER_CHANNELS, REMINDER_CHANNEL_LABELS, type ActionState } from "@/lib/validation/schemas";
import { todayISO } from "@/lib/utils";
import type { Reminder } from "@/lib/database.types";

export type ReminderClientOption = { id: string; name: string; company: string | null };
export type ReminderQuoteOption = { id: string; title: string; client_id: string };

type ReminderDialogProps = {
  open: boolean;
  onClose: () => void;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  reminder?: Reminder;
  clients: ReminderClientOption[];
  quotes: ReminderQuoteOption[];
  defaultClientId?: string;
  defaultQuoteId?: string;
};

export function ReminderDialog({ open, onClose, action, reminder, clients, quotes, defaultClientId, defaultQuoteId }: ReminderDialogProps) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const [clientId, setClientId] = useState(reminder?.client_id ?? defaultClientId ?? "");
  const router = useRouter();
  const { toast } = useToast();
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Enregistré.", "success");
      onClose();
      router.refresh();
    }
    // onClose est stable (useCallback côté parent) ; on ne veut réagir qu'au changement d'état.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const filteredQuotes = clientId ? quotes.filter((q) => q.client_id === clientId) : quotes;

  return (
    <Dialog open={open} onClose={onClose} title={reminder ? "Modifier la relance" : "Planifier une relance"}>
      <form action={formAction} className="space-y-4" noValidate>
        {state.message && !state.ok && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            {state.message}
          </p>
        )}
        <Field label="Titre" name="title" error={errors.title} required>
          <Input id="title" name="title" required maxLength={160} defaultValue={reminder?.title ?? ""} placeholder="Relancer pour le devis cuisine" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" name="due_at" error={errors.due_at} required>
            <Input id="due_at" name="due_at" type="date" required defaultValue={reminder?.due_at ?? todayISO()} />
          </Field>
          <Field label="Canal" name="channel" error={errors.channel} required>
            <Select id="channel" name="channel" defaultValue={reminder?.channel ?? "email"}>
              {REMINDER_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {REMINDER_CHANNEL_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Client" name="client_id" error={errors.client_id} hint="Facultatif">
          <Select id="client_id" name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Aucun client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Devis concerné" name="quote_id" error={errors.quote_id} hint="Facultatif">
          <Select id="quote_id" name="quote_id" defaultValue={reminder?.quote_id ?? defaultQuoteId ?? ""}>
            <option value="">Aucun devis</option>
            {filteredQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" name="notes" error={errors.notes}>
          <Textarea id="notes" name="notes" rows={3} maxLength={5000} defaultValue={reminder?.notes ?? ""} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" loading={pending}>
            {reminder ? "Enregistrer" : "Planifier"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

type NewReminderButtonProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  clients: ReminderClientOption[];
  quotes: ReminderQuoteOption[];
};

/** Bouton « Nouvelle relance » : ouvre la boîte de dialogue (aussi via ?nouvelle=1&client=…). */
export function NewReminderButton({ action, clients, quotes }: NewReminderButtonProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const autoOpen = params.get("nouvelle") === "1";
  const [open, setOpen] = useState(autoOpen);
  const [key, setKey] = useState(0);
  const defaultClientId = params.get("client") ?? undefined;
  const defaultQuoteId = params.get("devis") ?? undefined;

  const close = () => {
    setOpen(false);
    setKey((k) => k + 1); // réinitialise le formulaire à la prochaine ouverture
    if (autoOpen) router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouvelle relance
      </Button>
      <ReminderDialog key={key} open={open} onClose={close} action={action} clients={clients} quotes={quotes} defaultClientId={defaultClientId} defaultQuoteId={defaultQuoteId} />
    </>
  );
}
