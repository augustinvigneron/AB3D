"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/validation/schemas";
import type { Quote } from "@/lib/database.types";
import type { QuoteActionState } from "@/app/(app)/devis/actions";

type QuoteFormProps = {
  action: (prev: QuoteActionState, formData: FormData) => Promise<QuoteActionState>;
  quote?: Quote;
  clients: Array<{ id: string; name: string; company: string | null }>;
  defaultClientId?: string;
  cancelHref: string;
};

export function QuoteForm({ action, quote, clients, defaultClientId, cancelHref }: QuoteFormProps) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const router = useRouter();
  const { toast } = useToast();
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Enregistré.", "success");
      router.push("/devis");
    }
  }, [state, router, toast]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.ok && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
          {state.message}
        </p>
      )}

      <Field label="Titre du devis" name="title" error={errors.title} required>
        <Input id="title" name="title" required maxLength={160} defaultValue={quote?.title ?? ""} placeholder="Rénovation salle de bain" autoFocus />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Client" name="client_id" error={errors.client_id} required>
          <Select id="client_id" name="client_id" defaultValue={quote?.client_id ?? defaultClientId ?? ""} required>
            <option value="" disabled>
              Choisir un client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Montant (€)" name="amount" error={errors.amount} required>
          <Input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={quote ? String(quote.amount) : ""} placeholder="1500" />
        </Field>
        <Field label="Statut" name="status" error={errors.status} required>
          <Select id="status" name="status" defaultValue={quote?.status ?? "brouillon"}>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date d'envoi" name="sent_at" error={errors.sent_at}>
            <Input id="sent_at" name="sent_at" type="date" defaultValue={quote?.sent_at ?? ""} />
          </Field>
          <Field label="Prochaine relance" name="next_followup_at" error={errors.next_followup_at}>
            <Input id="next_followup_at" name="next_followup_at" type="date" defaultValue={quote?.next_followup_at ?? ""} />
          </Field>
        </div>
      </div>

      <Field label="Notes" name="notes" error={errors.notes} hint="Facultatif">
        <Textarea id="notes" name="notes" maxLength={5000} defaultValue={quote?.notes ?? ""} rows={4} />
      </Field>

      <p className="text-xs text-fg-subtle">
        Cet outil sert au suivi commercial : il ne génère pas de factures ou de devis conformes à la réglementation.
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Annuler
        </Link>
        <Button type="submit" loading={pending}>
          {quote ? "Enregistrer les modifications" : "Créer le devis"}
        </Button>
      </div>
    </form>
  );
}
