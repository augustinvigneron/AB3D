"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AlertCircle, Download, Trash2 } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionState, Preferences } from "@/lib/validation/schemas";
import type { Profile } from "@/lib/database.types";
import { updatePreferencesAction, updateProfileAction, deleteAccountAction } from "@/app/(app)/parametres/actions";

function useActionToast(state: ActionState) {
  const { toast } = useToast();
  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? "success" : "error");
  }, [state, toast]);
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfileAction, { ok: false });
  useActionToast(state);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Votre nom" name="full_name" error={errors.full_name} required>
          <Input id="full_name" name="full_name" required maxLength={120} defaultValue={profile.full_name ?? ""} />
        </Field>
        <Field label="Nom de l'entreprise" name="company_name" error={errors.company_name} hint="Utilisé dans la signature des messages">
          <Input id="company_name" name="company_name" maxLength={120} defaultValue={profile.company_name ?? ""} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export function PreferencesForm({ preferences }: { preferences: Preferences }) {
  const [state, action, pending] = useActionState(updatePreferencesAction, { ok: false });
  useActionToast(state);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Début de semaine" name="week_start" error={errors.week_start}>
          <Select id="week_start" name="week_start" defaultValue={preferences.week_start}>
            <option value="monday">Lundi</option>
            <option value="sunday">Dimanche</option>
          </Select>
        </Field>
        <Field label="Délai de relance par défaut (jours)" name="default_reminder_delay" error={errors.default_reminder_delay} hint="Suggestion lors de la planification">
          <Input id="default_reminder_delay" name="default_reminder_delay" type="number" min={1} max={60} defaultValue={preferences.default_reminder_delay} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="compact_mode" defaultChecked={preferences.compact_mode} className="size-4 rounded border-border bg-bg-elevated accent-brand" />
        Affichage compact des listes
      </label>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} variant="secondary">
          Enregistrer les préférences
        </Button>
      </div>
    </form>
  );
}

export function DataSection() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Exporter mes données</p>
        <p className="text-xs text-fg-muted">Téléchargez l'ensemble de vos clients, devis, relances et historique au format JSON.</p>
      </div>
      <a href="/api/export" download className={buttonClasses("outline", "md")}>
        <Download className="size-4" /> Télécharger (JSON)
      </a>
    </div>
  );
}

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteAccountAction(value);
      // En cas de succès, l'action redirige : on ne revient ici que sur erreur.
      if (!res.ok) setError(res.message ?? "Suppression impossible.");
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Supprimer mon compte</p>
          <p className="text-xs text-fg-muted">Suppression immédiate et définitive de votre compte et de toutes vos données.</p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" /> Supprimer le compte
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setValue("");
          setError(null);
        }}
        title="Supprimer définitivement votre compte ?"
        description="Cette action est irréversible. Tous vos clients, devis, relances et votre historique seront effacés. Pensez à exporter vos données avant."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirm} loading={pending} disabled={value.trim().toUpperCase() !== "SUPPRIMER"}>
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <Field label="Tapez SUPPRIMER pour confirmer" name="confirm_delete" error={error ?? undefined}>
          <Input id="confirm_delete" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
        </Field>
        {error && (
          <p className="mt-2 flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="size-3" /> {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
