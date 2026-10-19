"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Copy, RefreshCw, Pencil, Check, AlertCircle, PenLine, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MESSAGE_TYPES, MESSAGE_TYPE_LABELS, TONES, TONE_LABELS, type FieldErrors } from "@/lib/validation/schemas";
import type { AiVariant } from "@/lib/ai/prompt";
import { formatDate, formatEuro } from "@/lib/utils";

type Quota = { used: number; limit: number; plan: string };

export type AssistantQuote = { id: string; title: string; amount: number; sentAt: string | null; clientName: string | null };

type AiAssistantProps = {
  /** "ai" : un fournisseur d'IA est configuré ; "templates" : rédaction par modèles, sans IA. */
  mode: "ai" | "templates";
  providerLabel: string | null;
  /** Quota mensuel, uniquement en mode IA. */
  initialQuota: Quota | null;
  quotes: AssistantQuote[];
  defaults: { clientName: string; quoteId: string; quoteInfo: string; senderName: string; companyName: string };
};

export function AiAssistant({ mode, providerLabel, initialQuota, quotes, defaults }: AiAssistantProps) {
  const isAi = mode === "ai";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [variants, setVariants] = useState<AiVariant[] | null>(null);
  const [resultMode, setResultMode] = useState<"ai" | "templates">(mode);
  const [quota, setQuota] = useState<Quota | null>(initialQuota);
  const [lastPayload, setLastPayload] = useState<Record<string, string | number> | null>(null);
  const [seed, setSeed] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [clientName, setClientName] = useState(defaults.clientName);
  const [quoteId, setQuoteId] = useState(quotes.some((q) => q.id === defaults.quoteId) ? defaults.quoteId : "");
  const { toast } = useToast();

  const selectedQuote = quotes.find((q) => q.id === quoteId) ?? null;
  const quotaLeft = quota ? Math.max(0, quota.limit - quota.used) : Infinity;

  function onQuoteChange(id: string) {
    setQuoteId(id);
    const q = quotes.find((x) => x.id === id);
    if (q?.clientName) setClientName(q.clientName);
  }

  async function run(payload: Record<string, string | number>) {
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
      setGeneration((g) => g + 1);
      setResultMode(data.mode === "ai" ? "ai" : "templates");
      if (data.quota) setQuota(data.quota);
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
    const payload: Record<string, string | number> = {};
    form.forEach((v, k) => {
      if (typeof v === "string") payload[k] = v;
    });
    payload.seed = 0;
    setSeed(0);
    void run(payload);
  }

  function regenerate() {
    if (!lastPayload) return;
    const next = seed + 1;
    setSeed(next);
    void run({ ...lastPayload, seed: next });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Votre demande</h2>
          {quota && (
            <Badge tone={quotaLeft === 0 ? "danger" : "brand"}>
              {quota.used}/{quota.limit} ce mois
            </Badge>
          )}
        </div>

        {!isAi && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-xs">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" />
            <p>
              Les messages sont rédigés à partir de <strong>modèles éprouvés</strong>, complétés avec vos informations. Illimité, et aucune donnée n'est
              envoyée à un service extérieur.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {quotes.length > 0 && (
            <Field label="Devis concerné" name="quoteId" hint="Facultatif — remplit le client, le titre, le montant et la date d'envoi">
              <Select id="quoteId" value={quoteId} onChange={(e) => onQuoteChange(e.target.value)}>
                <option value="">Aucun devis</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} — {formatEuro(q.amount)}
                    {q.clientName ? ` (${q.clientName})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {selectedQuote && (
            <>
              <input type="hidden" name="quoteTitle" value={selectedQuote.title} />
              <input type="hidden" name="quoteAmount" value={String(selectedQuote.amount)} />
              <input type="hidden" name="quoteSentAt" value={selectedQuote.sentAt ?? ""} />
              <p className="-mt-2 text-xs text-fg-subtle">
                Envoyé le {formatDate(selectedQuote.sentAt)} · {formatEuro(selectedQuote.amount)}
              </p>
            </>
          )}

          <Field label="Nom du client" name="clientName" error={fieldErrors.clientName} required>
            <Input id="clientName" name="clientName" required maxLength={120} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Jean Martin" />
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
          {isAi ? (
            <Field label="Contexte de la relation" name="context" error={fieldErrors.context} hint="Ex. : visite sur place la semaine dernière, client intéressé mais hésitant.">
              <Textarea id="context" name="context" rows={3} maxLength={2000} />
            </Field>
          ) : (
            <Field label="Phrase personnelle" name="context" error={fieldErrors.context} hint="Facultatif. Ex. : « Suite à notre visite sur le chantier » ou « J’ai bien noté vos remarques sur la couleur. »">
              <Textarea id="context" name="context" rows={2} maxLength={300} />
            </Field>
          )}
          {!selectedQuote && (
            <Field label="Informations sur le devis" name="quoteInfo" error={fieldErrors.quoteInfo} hint="Facultatif. Ex. : devis n°24 pour la cuisine. Seules ces informations seront reprises.">
              <Textarea id="quoteInfo" name="quoteInfo" rows={2} maxLength={1000} defaultValue={defaults.quoteInfo} />
            </Field>
          )}
          <input type="hidden" name="senderName" value={defaults.senderName} />
          <input type="hidden" name="companyName" value={defaults.companyName} />

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} disabled={quotaLeft === 0}>
            {isAi ? <Sparkles className="size-4" /> : <PenLine className="size-4" />}
            {quotaLeft === 0 ? "Quota mensuel atteint" : "Rédiger 3 propositions"}
          </Button>
          <p className="text-xs text-fg-subtle">
            {isAi
              ? `${providerLabel ? `Génération via ${providerLabel}. ` : ""}Chaque génération compte pour 1 dans votre quota mensuel. `
              : ""}
            Aucun message n'est envoyé automatiquement : vous relisez, modifiez et envoyez vous-même.
          </p>
          {!defaults.senderName && (
            <p className="text-xs text-fg-subtle">Astuce : renseignez votre nom et votre entreprise dans Paramètres pour signer automatiquement les messages.</p>
          )}
        </form>
      </Card>

      <div className="space-y-4 lg:col-span-3">
        {variants === null ? (
          <Card className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              {isAi ? <Sparkles className="size-6" /> : <PenLine className="size-6" />}
            </div>
            <h3 className="font-semibold">Vos propositions apparaîtront ici</h3>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">Trois versions : professionnelle, amicale, et courte. Vous pourrez les copier ou les modifier avant envoi.</p>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                {resultMode === "ai" ? (
                  <Badge tone="success">
                    <Sparkles className="size-3" /> Rédigé par IA
                  </Badge>
                ) : (
                  <Badge tone="info">
                    <PenLine className="size-3" /> Rédigé à partir de modèles
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-xs">
                  <Info className="size-3" /> Relisez avant d'envoyer.
                </span>
              </div>
              <Button variant="secondary" size="sm" loading={loading} disabled={quotaLeft === 0 || !lastPayload} onClick={regenerate}>
                <RefreshCw className="size-4" /> Autres formulations
              </Button>
            </div>
            {variants.map((v) => (
              <VariantCard key={`${v.style}-${generation}`} variant={v} onCopied={() => toast("Message copié dans le presse-papiers.", "success")} />
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
        <div className="rounded-lg bg-bg-elevated p-4 text-sm">
          {subject && <p className="mb-2 font-medium text-fg-muted">Objet : {subject}</p>}
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
      )}
    </Card>
  );
}
