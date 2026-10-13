import { z } from "zod";

/* ───────────── Helpers ───────────── */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), "Date invalide");

/** Chaîne optionnelle : "" devient null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalDate = isoDate
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

/* ───────────── Auth ───────────── */

export const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide").max(254);
export const passwordSchema = z.string().min(8, "8 caractères minimum").max(128, "128 caractères maximum");

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Votre nom est requis").max(120),
  companyName: optionalText(120),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

/* ───────────── Clients ───────────── */

export const CLIENT_STATUSES = ["prospect", "actif", "inactif", "perdu"] as const;
export const CLIENT_STATUS_LABELS: Record<(typeof CLIENT_STATUSES)[number], string> = {
  prospect: "Prospect",
  actif: "Client actif",
  inactif: "Inactif",
  perdu: "Perdu",
};

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120, "120 caractères maximum"),
  company: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Adresse email invalide")
    .transform((v) => (v === "" ? null : v))
    .optional()
    .transform((v) => v ?? null),
  phone: optionalText(40),
  notes: optionalText(5000),
  status: z.enum(CLIENT_STATUSES, { message: "Statut invalide" }),
  last_contact_at: optionalDate,
  next_followup_at: optionalDate,
});
export type ClientInput = z.infer<typeof clientSchema>;

/* ───────────── Devis ───────────── */

export const QUOTE_STATUSES = ["brouillon", "envoye", "en_attente", "accepte", "refuse"] as const;
export const QUOTE_STATUS_LABELS: Record<(typeof QUOTE_STATUSES)[number], string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  en_attente: "En attente",
  accepte: "Accepté",
  refuse: "Refusé",
};

export const quoteSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(160, "160 caractères maximum"),
  client_id: z.string().uuid("Client invalide"),
  amount: z.coerce
    .number({ message: "Montant invalide" })
    .min(0, "Le montant doit être positif")
    .max(99_999_999, "Montant trop élevé")
    .transform((v) => Math.round(v * 100) / 100),
  sent_at: optionalDate,
  status: z.enum(QUOTE_STATUSES, { message: "Statut invalide" }),
  next_followup_at: optionalDate,
  notes: optionalText(5000),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

/* ───────────── Relances ───────────── */

export const REMINDER_CHANNELS = ["email", "telephone", "sms", "visite", "autre"] as const;
export const REMINDER_CHANNEL_LABELS: Record<(typeof REMINDER_CHANNELS)[number], string> = {
  email: "Email",
  telephone: "Téléphone",
  sms: "SMS",
  visite: "Visite",
  autre: "Autre",
};

export const reminderSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(160, "160 caractères maximum"),
  client_id: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : null)),
  quote_id: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : null)),
  due_at: isoDate,
  channel: z.enum(REMINDER_CHANNELS, { message: "Canal invalide" }),
  notes: optionalText(5000),
});
export type ReminderInput = z.infer<typeof reminderSchema>;

/* ───────────── Assistant IA ───────────── */

export const MESSAGE_TYPES = ["relance_devis", "prise_de_nouvelles", "remerciement", "rappel_rdv", "autre"] as const;
export const MESSAGE_TYPE_LABELS: Record<(typeof MESSAGE_TYPES)[number], string> = {
  relance_devis: "Relance de devis",
  prise_de_nouvelles: "Prise de nouvelles",
  remerciement: "Remerciement après prestation",
  rappel_rdv: "Rappel de rendez-vous",
  autre: "Autre",
};

export const TONES = ["professionnel", "chaleureux", "direct"] as const;
export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  professionnel: "Professionnel",
  chaleureux: "Chaleureux",
  direct: "Direct",
};

export const aiRequestSchema = z.object({
  clientName: z.string().trim().min(1, "Le nom du client est requis").max(120),
  context: z.string().trim().max(2000, "2000 caractères maximum").optional().default(""),
  messageType: z.enum(MESSAGE_TYPES, { message: "Type de message invalide" }),
  tone: z.enum(TONES, { message: "Ton invalide" }),
  quoteInfo: z.string().trim().max(1000, "1000 caractères maximum").optional().default(""),
  senderName: z.string().trim().max(120).optional().default(""),
  companyName: z.string().trim().max(120).optional().default(""),
});
export type AiRequest = z.infer<typeof aiRequestSchema>;

/* ───────────── Paramètres ───────────── */

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Votre nom est requis").max(120),
  company_name: optionalText(120),
});

export const preferencesSchema = z.object({
  compact_mode: z.boolean().default(false),
  week_start: z.enum(["monday", "sunday"]).default("monday"),
  default_reminder_delay: z.coerce.number().int().min(1).max(60).default(7),
});
export type Preferences = z.infer<typeof preferencesSchema>;

/* ───────────── Utilitaires de formulaire ───────────── */

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
};

export const initialActionState: ActionState = { ok: false };

/** Transforme un FormData en objet simple (ignore les champs internes $ACTION_*). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
