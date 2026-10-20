/**
 * Liens « Ouvrir dans Gmail » et « Ajouter à Google Agenda ».
 *
 * Aucun accès au compte Google de l'utilisateur : ce sont de simples liens
 * pré-remplis, ouverts dans son navigateur. C'est lui qui clique sur
 * « Envoyer » dans Gmail ou « Enregistrer » dans Google Agenda.
 */

/** Ouvre la fenêtre de rédaction Gmail avec destinataire, objet et message pré-remplis. */
export function gmailComposeUrl({ to, subject, body }: { to?: string | null; subject?: string; body: string }): string {
  const params = new URLSearchParams({ view: "cm", fs: "1" });
  if (to) params.set("to", to);
  if (subject) params.set("su", subject);
  params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** YYYY-MM-DD → YYYYMMDD du lendemain (fin exclusive d'un événement « journée entière »). */
function nextDayCompact(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Crée un événement « journée entière » pré-rempli dans Google Agenda. */
export function googleCalendarUrl({ title, date, details }: { title: string; date: string; details?: string }): string {
  const start = date.replace(/-/g, "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${nextDayCompact(date)}` });
  if (details) params.set("details", details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
