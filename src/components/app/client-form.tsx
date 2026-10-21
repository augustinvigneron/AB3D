"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useUpgrade } from "@/components/app/upgrade-dialog";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from "@/lib/validation/schemas";
import type { Client } from "@/lib/database.types";
import type { ClientActionState } from "@/app/(app)/clients/actions";

type ClientFormProps = {
  action: (prev: ClientActionState, formData: FormData) => Promise<ClientActionState>;
  client?: Client;
  cancelHref: string;
};

export function ClientForm({ action, client, cancelHref }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const router = useRouter();
  const { toast } = useToast();
  const { requireUpgrade } = useUpgrade();
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok && state.id) {
      toast(state.message ?? "Enregistré.", "success");
      router.push(`/clients/${state.id}`);
    } else if (!state.ok && state.upgrade) {
      // Limite de l'offre atteinte : on montre directement les offres.
      requireUpgrade(state.upgrade);
    }
  }, [state, router, toast, requireUpgrade]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.ok && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom" name="name" error={errors.name} required>
          <Input id="name" name="name" required maxLength={120} defaultValue={client?.name ?? ""} placeholder="Jean Martin" autoFocus />
        </Field>
        <Field label="Entreprise" name="company" error={errors.company} hint="Facultatif">
          <Input id="company" name="company" maxLength={120} defaultValue={client?.company ?? ""} placeholder="Martin Rénovation" />
        </Field>
        <Field label="Email" name="email" error={errors.email} hint="Facultatif">
          <Input id="email" name="email" type="email" maxLength={254} defaultValue={client?.email ?? ""} placeholder="jean@exemple.fr" />
        </Field>
        <Field label="Téléphone" name="phone" error={errors.phone} hint="Facultatif">
          <Input id="phone" name="phone" type="tel" maxLength={40} defaultValue={client?.phone ?? ""} placeholder="06 12 34 56 78" />
        </Field>
        <Field label="Statut" name="status" error={errors.status} required>
          <Select id="status" name="status" defaultValue={client?.status ?? "prospect"}>
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CLIENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dernier contact" name="last_contact_at" error={errors.last_contact_at}>
            <Input id="last_contact_at" name="last_contact_at" type="date" defaultValue={client?.last_contact_at ?? ""} />
          </Field>
          <Field label="Prochaine relance" name="next_followup_at" error={errors.next_followup_at}>
            <Input id="next_followup_at" name="next_followup_at" type="date" defaultValue={client?.next_followup_at ?? ""} />
          </Field>
        </div>
      </div>

      <Field label="Notes" name="notes" error={errors.notes} hint="Contexte, préférences, historique…">
        <Textarea id="notes" name="notes" maxLength={5000} defaultValue={client?.notes ?? ""} rows={5} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Annuler
        </Link>
        <Button type="submit" loading={pending}>
          {client ? "Enregistrer les modifications" : "Ajouter le client"}
        </Button>
      </div>
    </form>
  );
}
