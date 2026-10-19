/**
 * Rédaction de messages SANS IA ni API externe.
 *
 * Les messages sont assemblés à partir de banques de phrases rédigées à la
 * main, remplies uniquement avec les informations fournies par l'utilisateur
 * (nom du client, devis choisi, phrase personnelle, signature). Rien n'est
 * inventé : sans montant ni date fournis, aucun montant ni date n'apparaît.
 *
 * « Régénérer » change la graine (seed) et donc les formulations choisies.
 */
import type { AiRequest } from "@/lib/validation/schemas";
import { VARIANT_LABELS, type AiVariant } from "./prompt";
import { todayISO } from "@/lib/utils";

type Rng = () => number;

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];

/** Ajoute un point final si la phrase n'a pas de ponctuation finale. */
function sentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const capitalized = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

/** « 7 900 € » pour un montant rond, « 1 250,50 € » sinon. */
function formatAmount(amount: number): string {
  const cents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
}

function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

function formatDayMonth(iso: string, today: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const sameYear = today.slice(0, 4) === String(y);
  return new Intl.DateTimeFormat("fr-FR", sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

type QuoteFacts = {
  /** Sans article : « devis « Cuisine » d'un montant de 4 800 €, que je vous ai envoyé le 3 octobre ». */
  full: string;
  /** Sans article : « devis « Cuisine » » ou « devis que je vous ai envoyé ». */
  short: string;
  /** Rappel en texte libre (« Pour rappel : … »), si l'utilisateur n'a pas choisi de devis. */
  reminder: string;
  /** Devis envoyé il y a plus de 30 jours. */
  old: boolean;
  /** Pour l'objet du message. */
  title: string;
};

function quoteFacts(req: AiRequest, today: string): QuoteFacts {
  const title = req.quoteTitle?.trim() ?? "";
  const amount = typeof req.quoteAmount === "number" ? formatAmount(req.quoteAmount) : "";
  let when = "";
  let old = false;
  if (req.quoteSentAt) {
    const days = daysBetween(req.quoteSentAt, today);
    old = days > 30;
    if (days >= 0 && days <= 6) when = days <= 1 ? "récemment" : "il y a quelques jours";
    else if (days > 6) when = `le ${formatDayMonth(req.quoteSentAt, today)}`;
  }

  if (title) {
    const base = `devis «\u00a0${title}\u00a0»`;
    const withAmount = amount ? `${base} d'un montant de ${amount}` : base;
    const full = when ? `${withAmount}, que je vous ai envoyé ${when}` : `${withAmount}, que je vous ai transmis`;
    return { full, short: base, reminder: "", old, title };
  }
  const reminder = req.quoteInfo?.trim() ? sentence(`Pour rappel : ${req.quoteInfo.trim()}`) : "";
  return { full: "devis que je vous ai transmis", short: "devis que je vous ai envoyé", reminder, old, title: "" };
}

function signature(req: AiRequest): string {
  return [req.senderName, req.companyName].map((s) => s?.trim()).filter(Boolean).join(" — ") || "[Votre nom]";
}

const CLOSINGS: Record<AiRequest["tone"], { pro: readonly string[]; court: readonly string[] }> = {
  professionnel: { pro: ["Cordialement,", "Bien cordialement,", "Je vous remercie par avance et vous souhaite une bonne journée,"], court: ["Cordialement,", "Bonne journée,"] },
  chaleureux: { pro: ["Bien à vous,", "Belle journée à vous,", "Au plaisir d'échanger avec vous,"], court: ["Belle journée,", "À bientôt,"] },
  direct: { pro: ["Merci d'avance pour votre retour,", "Dans l'attente de votre retour,", "Cordialement,"], court: ["Merci d'avance,", "Bonne journée,"] },
};
/** Pour un remerciement, pas de « Merci d'avance » ni « Dans l'attente de votre retour ». */
const THANKS_CLOSINGS = { pro: ["Cordialement,", "Bien cordialement,", "Bien à vous,"], court: ["Bonne journée,", "À bientôt,"] } as const;

const WARM_CLOSINGS = ["Bonne journée,", "Belle journée à vous,", "À très bientôt,", "Au plaisir,"] as const;

type Bank = {
  subjects: (q: QuoteFacts) => readonly string[];
  pro: (q: QuoteFacts) => { open: readonly string[]; middle: readonly string[]; offer: readonly string[] };
  amical: (q: QuoteFacts) => { open: readonly string[]; middle: readonly string[]; offer: readonly string[] };
  court: (q: QuoteFacts) => readonly string[];
};

const BANKS: Record<AiRequest["messageType"], Bank> = {
  relance_devis: {
    subjects: (q) => (q.title ? [`Votre devis «\u00a0${q.title}\u00a0»`, `Suite à mon devis «\u00a0${q.title}\u00a0»`, "Point sur votre projet"] : ["Suite à mon devis", "Votre devis", "Point sur votre projet"]),
    pro: (q) => ({
      open: [`Je me permets de revenir vers vous concernant le ${q.full}.`, `Je reviens vers vous au sujet du ${q.full}.`, `Je souhaitais faire un point avec vous concernant le ${q.full}.`],
      middle: ["Avez-vous eu l'occasion d'en prendre connaissance ?", "Avez-vous pu l'étudier ?", "Je voulais savoir s'il répondait à vos attentes."],
      offer: [
        "Je reste à votre disposition pour en discuter ou l'ajuster si besoin.",
        "Si certains points méritent d'être précisés ou adaptés, j'en parlerai avec plaisir avec vous.",
        "N'hésitez pas à me faire part de vos questions, j'y répondrai volontiers.",
      ],
    }),
    amical: (q) => ({
      open: ["J'espère que vous allez bien !", "J'espère que tout se passe bien de votre côté."],
      middle: [`Je voulais savoir si vous aviez pu jeter un œil au ${q.full}.`, `Avez-vous eu le temps de regarder le ${q.full} ?`],
      offer: ["Si vous avez la moindre question, je suis joignable quand vous voulez.", "Dites-moi si quelque chose vous fait hésiter, on peut en parler simplement."],
    }),
    court: (q) => [`Avez-vous pu consulter le ${q.short} ? Je reste disponible si besoin.`, `Petit suivi concernant le ${q.short} : avez-vous pu le regarder ?`, `Je reviens vers vous pour le ${q.short}. Avez-vous des questions ?`],
  },
  prise_de_nouvelles: {
    subjects: () => ["Des nouvelles de votre projet", "Prise de nouvelles", "Où en est votre projet ?"],
    pro: () => ({
      open: ["Je me permets de prendre de vos nouvelles concernant votre projet.", "Je reviens vers vous pour savoir où en est votre projet."],
      middle: ["Votre réflexion a-t-elle avancé ?", "Avez-vous pu avancer de votre côté ?"],
      offer: ["Je reste à votre disposition si vous souhaitez en discuter.", "Si je peux vous aider à avancer, n'hésitez pas à me contacter."],
    }),
    amical: () => ({
      open: ["J'espère que vous allez bien !", "J'espère que tout va bien pour vous."],
      middle: ["Je voulais simplement prendre des nouvelles de votre projet.", "Je pensais à votre projet et je voulais savoir où vous en étiez."],
      offer: ["Si je peux vous être utile, faites-moi signe !", "Je suis là si vous avez besoin d'un coup de main."],
    }),
    court: () => ["Où en est votre projet ? Je reste disponible si besoin.", "Petit message pour prendre de vos nouvelles. Je reste disponible."],
  },
  remerciement: {
    subjects: () => ["Merci pour votre confiance", "Merci !", "Suite à notre collaboration"],
    pro: () => ({
      open: ["Je tenais à vous remercier pour votre confiance.", "Je vous remercie sincèrement pour votre confiance."],
      middle: ["Ce fut un plaisir de travailler pour vous.", "J'espère que le résultat vous donne entière satisfaction."],
      offer: ["N'hésitez pas à me recontacter pour tout besoin futur.", "Je reste à votre disposition pour vos prochains projets."],
    }),
    amical: () => ({
      open: ["Un grand merci pour votre confiance !", "Merci encore pour votre confiance !"],
      middle: ["Ce fut un vrai plaisir de travailler avec vous.", "J'espère que le résultat vous plaît."],
      offer: ["Si un proche a besoin de mes services, n'hésitez pas à lui transmettre mes coordonnées.", "Au plaisir de travailler à nouveau ensemble !"],
    }),
    court: () => ["Merci pour votre confiance. À bientôt !", "Merci encore, ce fut un plaisir de travailler pour vous."],
  },
  rappel_rdv: {
    subjects: () => ["Rappel de notre rendez-vous", "Notre rendez-vous", "Confirmation de rendez-vous"],
    pro: () => ({
      open: ["Je me permets de vous rappeler notre rendez-vous à venir.", "Je vous confirme notre rendez-vous prévu prochainement."],
      middle: ["Merci de me prévenir en cas d'empêchement.", "Si le créneau ne vous convient plus, n'hésitez pas à me le signaler."],
      offer: ["Je reste à votre disposition pour toute question d'ici là.", "N'hésitez pas à me contacter si besoin."],
    }),
    amical: () => ({
      open: ["Petit rappel pour notre rendez-vous à venir !", "Je vous écris pour vous rappeler notre rendez-vous."],
      middle: ["J'ai hâte d'échanger avec vous.", "Ce sera l'occasion de faire le point ensemble."],
      offer: ["Si quelque chose change de votre côté, dites-le-moi simplement.", "En cas d'imprévu, un petit message suffit."],
    }),
    court: () => ["Petit rappel de notre rendez-vous. Dites-moi si quelque chose change.", "Je vous confirme notre rendez-vous. À bientôt !"],
  },
  autre: {
    subjects: () => ["Suite à nos échanges", "Petit message", "Votre projet"],
    pro: () => ({
      open: ["Je me permets de vous contacter à la suite de nos échanges.", "Je reviens vers vous suite à nos derniers échanges."],
      middle: ["Je souhaitais faire un point avec vous.", "Je voulais savoir si vous aviez des questions."],
      offer: ["Je reste à votre disposition.", "N'hésitez pas à me contacter si besoin."],
    }),
    amical: () => ({
      open: ["J'espère que vous allez bien !", "J'espère que tout se passe bien pour vous."],
      middle: ["Je reviens vers vous suite à nos échanges.", "Je voulais faire un petit point avec vous."],
      offer: ["Je suis joignable quand vous voulez.", "Faites-moi signe si besoin !"],
    }),
    court: () => ["Je reviens vers vous suite à nos échanges. Je reste disponible.", "Petit message pour faire le point. Je reste disponible."],
  },
};

const OLD_QUOTE_LINE = [
  "Si votre projet a évolué ou n'est plus d'actualité, un simple mot de votre part me suffira.",
  "Si vos besoins ont changé entre-temps, dites-le-moi : je peux adapter la proposition.",
] as const;

/** Débuts de phrase « circonstanciels » qui se rattachent à la phrase suivante par une virgule. */
const LEAD_IN = /^(suite à|à la suite d|pour faire suite|comme convenu|comme promis|comme évoqué|après|depuis|lors d|à l'issue d|en complément d)/i;

/**
 * Insère la phrase personnelle de l'utilisateur :
 * - « Suite à notre visite » + « Je reviens vers vous… » → « Suite à notre visite, je reviens vers vous… »
 * - une phrase complète est ajoutée après la phrase d'accroche.
 */
function attachPersonal(personal: string, phrase: string): string {
  const p = personal.trim().replace(/[.!?…,;:]+$/, "");
  if (!p) return phrase;
  if (LEAD_IN.test(p)) {
    const head = p.charAt(0).toUpperCase() + p.slice(1);
    return `${head}, ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}`;
  }
  return `${phrase} ${sentence(p)}`;
}

const join = (...parts: string[]) => parts.filter((p) => p && p.trim()).join("\n\n");

/** Rédige les trois propositions (professionnelle, amicale, courte) sans IA. */
export function writeFromTemplates(req: AiRequest, today: string = todayISO()): AiVariant[] {
  const rng = seededRng(hashString(`${req.clientName}|${req.messageType}`) + (req.seed ?? 0) * 7919);
  const q = quoteFacts(req, today);
  const bank = BANKS[req.messageType];
  const greeting = `Bonjour ${req.clientName.trim()},`;
  const personal = (req.context ?? "").trim();
  const sign = signature(req);
  const isQuote = req.messageType === "relance_devis";
  const oldLine = isQuote && q.old ? pick(rng, OLD_QUOTE_LINE) : "";
  const subject = pick(rng, bank.subjects(q));
  const closings = req.messageType === "remerciement" ? THANKS_CLOSINGS : CLOSINGS[req.tone];

  const pro = bank.pro(q);
  const professionnel = join(
    greeting,
    attachPersonal(personal, pick(rng, pro.open)),
    isQuote ? q.reminder : "",
    [pick(rng, pro.middle), pick(rng, pro.offer)].join(" "),
    oldLine,
    `${pick(rng, closings.pro)}\n${sign}`,
  );

  const am = bank.amical(q);
  const amical = join(
    greeting,
    [pick(rng, am.open), attachPersonal(personal, pick(rng, am.middle))].join(" "),
    isQuote ? q.reminder : "",
    pick(rng, am.offer),
    oldLine,
    `${pick(rng, WARM_CLOSINGS)}\n${sign}`,
  );

  const court = join(greeting, pick(rng, bank.court(q)), `${pick(rng, closings.court)}\n${sign}`);

  return [
    { style: "professionnel", label: VARIANT_LABELS.professionnel, subject, body: professionnel },
    { style: "amical", label: VARIANT_LABELS.amical, subject, body: amical },
    { style: "court", label: VARIANT_LABELS.court, subject, body: court },
  ];
}
