import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ClientStatus, QuoteStatus } from "@/lib/database.types";
import { CLIENT_STATUS_LABELS, QUOTE_STATUS_LABELS } from "@/lib/validation/schemas";

const clientTones: Record<ClientStatus, BadgeTone> = {
  prospect: "info",
  actif: "success",
  inactif: "neutral",
  perdu: "danger",
};

const quoteTones: Record<QuoteStatus, BadgeTone> = {
  brouillon: "neutral",
  envoye: "info",
  en_attente: "warning",
  accepte: "success",
  refuse: "danger",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge tone={clientTones[status]}>{CLIENT_STATUS_LABELS[status]}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={quoteTones[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}
