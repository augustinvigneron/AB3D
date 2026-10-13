"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Copy, RefreshCw, Pencil, Check, AlertCircle, FlaskConical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MESSAGE_TYPES, MESSAGE_TYPE_LABELS, TONES, TONE_LABELS, type FieldErrors } from "@/lib/validation/schemas";
import type { AiVariant } from "@/lib/ai/prompt";
import { cn } from "@/lib/utils";

type Quota = { used: number; limit: number; plan: string };

type AiAssistantProps = {
  aiConfigured: boolean;
  providerLabel: string | null;
  initialQuota: Quota;
  defaults: { clientName: string; quoteInfo: string; senderName: string; companyName: string };
};

export function AiAssistant({ aiConfigured, providerLabel, initialQuota, defaults }: AiAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [variants, setVariants] = useState<AiVariant[] | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [quota, setQuota] = useState(initialQuota);
  const [lastPayload, setLastPayload] = useState<Record<string, string> | null>(null);
  const { toast } = useToast();

  const quotaLeft = Math.max(0, quota.limit - quota.used);

  async function run(payload: Record<string, string>) {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inattendue.");
        if (data.errors) setFieldErrors(data.errors);
        if (data.quota) setQuota(data.quota);
        return;
      }
      setVariants(data.variants);
      setSimulated(Boolean(data.simulated));
      setQuota(data.quota);
      setLastPayload(payload);
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    form.forEach((v, k) => {
      if (typeof v === "string") payload[k] = v;
    });
    void run(payload);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Votre demande</h2>
          <Badge tone={quotaLeft === 0 ? "danger" : "brand"}>
            {quota.used}/{quota.limit} ce mois
          </Badge>
        </div>

        {!aiConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              <strong>Mode simulation.</strong> Aucune clé d'API IA n'est configurée sur le serveur : les propositions sont assemblées localement à partir de gabarits,
              sans modèle d'IA. Renseignez <code className="font-mono">AI_API_KEY</code> dans <code className="font-mono">.env.local</code> pour activer la vraie génération.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Nom du client" name="clientName" error={fieldErrors.clientName} required>
            <Input id="clientName" name="clientName" required maxLength={120} defaultValue={defaults.clientName} placeholder="Jean Martin" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type de message" name="messageType" error={fieldErrors.messageType} required>
              <Select id="messageType" name="messageType" defaultValue="relance_devis">
                {MESSAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MESSAGE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ton souhaité" name="tone" error={fieldErrors.tone} required>
              <Select id="tone" name="tone" defaultValue="professionnel">
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {TONE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Contexte de la relation" name="context" error={fieldErrors.context} hint="Ex. : visite sur place la semaine dernière, client intéressé mais hésitant.">
            <Textarea id="context" name="context" rows={3} maxLength={2000} />
          </Field>
          <Field label="Informations sur le devis" name="quoteInfo" error={fieldErrors.quoteInfo} hint="Ex. : devis n°24, 1 850 €, envoyé le 3 octobre. Seules ces informations seront utilisées.">
            <Textarea id="quoteInfo" name="quoteInfo" rows={2} maxLength={1000} defaultValue={defaults.quoteInfo} />
          </Field>
          <input type="hidden" name="senderName" value={defaults.senderName} />
          <input type="hidden" name="companyName" value={defaults.companyName} />

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} disabled={quotaLeft === 0}>
            <Sparkles className="size-4" />
            {quotaLeft === 0 ? "Quota mensuel atteint" : "Générer 3 propositions"}
          </Button>
          <p className="text-xs text-fg-subtle">
            {providerLabel ? `Génération via ${providerLabel}. ` : ""}
            Chaque génération compte pour 1 dans votre quota mensuel. Aucun message n'est envoyé automatiquement : vous relisez, modifiez et envoyez vous-même.
          </p>
        </form>
      </Card>

      <div className="space-y-4 lg:col-span-3">
        {variants === null ? (
          <Card className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Sparkles className="size-6" />
            </div>
            <h3 className="font-semibold">Vos propositions apparaîtront ici</h3>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">Trois versions : professionnelle, amicale, et courte. Vous pourrez les copier ou les modifier avant envoi.</p>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                {simulated ? (
                  <Badge tone="warning">
                    <FlaskConical className="size-3" /> Simulation locale — pas d'IA
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <Sparkles className="size-3" /> Généré par IA
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-xs">
                  <Info className="size-3" /> Vérifiez chaque information avant d'envoyer.
                </span>
              </div>
              <Button variant="secondary" size="sm" loading={loading} disabled={quotaLeft === 0 || !lastPayload} onClick={() => lastPayload && run(lastPayload)}>
                <RefreshCw className="size-4" /> Régénérer
              </Button>
            </div>
            {variants.map((v) => (
              <VariantCard key={v.style} variant={v} onCopied={() => toast("Message copié dans le presse-papiers.", "success")} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function VariantCard({ variant, onCopied }: { variant: AiVariant; onCopied: () => void }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(variant.subject);
  const [body, setBody] = useState(variant.body);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = subject ? `Objet : ${subject}\n\n${body}` : body;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : l'utilisateur peut sélectionner le texte.
    }
  };

  return (
    <Card className="animate-rise">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Badge tone="brand">{variant.label}</Badge>
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            <Pencil className="size-4" /> {editing ? "Terminer" : "Modifier"}
          </Button>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />} Copier
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <label className="label" htmlFor={`subject-${variant.style}`}>
            Objet
          </label>
          <Input id={`subject-${variant.style}`} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          <label className="label" htmlFor={`body-${variant.style}`}>
            Message
          </label>
          <Textarea id={`body-${variant.style}`} value={body} onChange={(e) => setBody(e.target.value)} rows={8} maxLength={3000} />
        </div>
      ) : (
        <div className={cn("rounded-lg bg-bg-elevated p-4 text-sm")}>
          {subject && <p className="mb-2 font-medium text-fg-muted">Objet : {subject}</p>}
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
      )}
    </Card>
  );
}
