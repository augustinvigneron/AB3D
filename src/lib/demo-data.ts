/**
 * Données FICTIVES pour le mode démonstration (/demo).
 * Aucune de ces personnes ou entreprises n'existe. Jamais chargées en production.
 */
import type { Client, Quote, Reminder } from "@/lib/database.types";
import { addDaysISO, todayISO } from "@/lib/utils";

const today = todayISO();
const DEMO_USER = "00000000-0000-0000-0000-000000000000";
const ts = `${today}T09:00:00.000Z`;

function client(partial: Partial<Client> & Pick<Client, "id" | "name" | "status">): Client {
  return {
    user_id: DEMO_USER,
    company: null,
    email: null,
    phone: null,
    notes: null,
    last_contact_at: null,
    next_followup_at: null,
    created_at: ts,
    updated_at: ts,
    ...partial,
  };
}

export const DEMO_CLIENTS: Client[] = [
  client({ id: "c1", name: "Camille Rousseau", company: "Boulangerie Rousseau", email: "contact@exemple-rousseau.fr", phone: "06 00 00 00 01", status: "prospect", last_contact_at: addDaysISO(today, -9), next_followup_at: addDaysISO(today, -2), notes: "Vitrine à refaire avant l'hiver. Hésite sur le budget." }),
  client({ id: "c2", name: "Thomas Bernard", status: "actif", email: "t.bernard@exemple.fr", phone: "06 00 00 00 02", last_contact_at: addDaysISO(today, -3), next_followup_at: today, notes: "Particulier, rénovation salle de bain terminée en septembre." }),
  client({ id: "c3", name: "Inès Marchand", company: "Atelier Marchand", email: "ines@exemple-marchand.fr", status: "actif", last_contact_at: addDaysISO(today, -20), next_followup_at: addDaysISO(today, 5) }),
  client({ id: "c4", name: "Lucas Petit", status: "prospect", phone: "06 00 00 00 04", last_contact_at: addDaysISO(today, -1), next_followup_at: addDaysISO(today, 3) }),
  client({ id: "c5", name: "Sophie Lambert", company: "Lambert & Fils", email: "sophie@exemple-lambert.fr", status: "inactif", last_contact_at: addDaysISO(today, -120) }),
  client({ id: "c6", name: "Nadia Benali", status: "perdu", last_contact_at: addDaysISO(today, -45), notes: "A choisi un autre prestataire." }),
];

export const DEMO_QUOTES: Quote[] = [
  { id: "q1", user_id: DEMO_USER, client_id: "c1", title: "Vitrine réfrigérée + pose", amount: 4800, sent_at: addDaysISO(today, -9), status: "en_attente", next_followup_at: addDaysISO(today, -2), notes: null, created_at: ts, updated_at: ts },
  { id: "q2", user_id: DEMO_USER, client_id: "c4", title: "Remplacement chaudière", amount: 3250, sent_at: addDaysISO(today, -1), status: "envoye", next_followup_at: addDaysISO(today, 6), notes: null, created_at: ts, updated_at: ts },
  { id: "q3", user_id: DEMO_USER, client_id: "c2", title: "Rénovation salle de bain", amount: 7900, sent_at: addDaysISO(today, -60), status: "accepte", next_followup_at: null, notes: null, created_at: ts, updated_at: ts },
  { id: "q4", user_id: DEMO_USER, client_id: "c3", title: "Étagères sur mesure", amount: 1150, sent_at: addDaysISO(today, -15), status: "en_attente", next_followup_at: addDaysISO(today, 5), notes: null, created_at: ts, updated_at: ts },
  { id: "q5", user_id: DEMO_USER, client_id: "c6", title: "Isolation combles", amount: 5600, sent_at: addDaysISO(today, -50), status: "refuse", next_followup_at: null, notes: null, created_at: ts, updated_at: ts },
];

export const DEMO_REMINDERS: Reminder[] = [
  { id: "r1", user_id: DEMO_USER, client_id: "c1", quote_id: "q1", title: "Relancer pour la vitrine", due_at: addDaysISO(today, -2), channel: "telephone", status: "a_faire", notes: "Proposer un paiement en 3 fois.", completed_at: null, created_at: ts, updated_at: ts },
  { id: "r2", user_id: DEMO_USER, client_id: "c2", quote_id: null, title: "Demander un avis Google", due_at: today, channel: "sms", status: "a_faire", notes: null, completed_at: null, created_at: ts, updated_at: ts },
  { id: "r3", user_id: DEMO_USER, client_id: "c4", quote_id: "q2", title: "Suivi devis chaudière", due_at: addDaysISO(today, 3), channel: "email", status: "a_faire", notes: null, completed_at: null, created_at: ts, updated_at: ts },
  { id: "r4", user_id: DEMO_USER, client_id: "c3", quote_id: "q4", title: "Relance étagères", due_at: addDaysISO(today, 5), channel: "email", status: "a_faire", notes: null, completed_at: null, created_at: ts, updated_at: ts },
  { id: "r5", user_id: DEMO_USER, client_id: "c2", quote_id: "q3", title: "Confirmer date d'intervention", due_at: addDaysISO(today, -10), channel: "telephone", status: "terminee", notes: null, completed_at: `${addDaysISO(today, -10)}T10:00:00.000Z`, created_at: ts, updated_at: ts },
];

export function demoClientById(id: string | null) {
  return DEMO_CLIENTS.find((c) => c.id === id) ?? null;
}
