import { MESSAGE_TYPE_LABELS, TONE_LABELS, type AiRequest } from "@/lib/validation/schemas";

export type AiVariant = { style: "professionnel" | "amical" | "court"; label: string; subject: string; body: string };

export const VARIANT_LABELS: Record<AiVariant["style"], string> = {
  professionnel: "Professionnelle",
  amical: "Amicale",
  court: "Courte et directe",
};

/**
 * Prompt système : cadre strict pour éviter toute invention
 * (montant, date, promesse) absente des données fournies.
 */
export const SYSTEM_PROMPT = `Tu es un assistant de rédaction pour des artisans et indépendants français.
Tu rédiges des messages de relance commerciale en français, prêts à être copiés dans un email ou un SMS.

Règles absolues :
1. N'invente JAMAIS de montant, de date, de délai, de remise, de promesse, de nom de produit ou toute information qui n'est pas explicitement présente dans les données fournies. Si une information manque, n'en parle pas ou laisse un crochet du type [à compléter].
2. Reste factuel, poli et concis. Pas de formules exagérées, pas de pression agressive.
3. Ne mentionne pas que tu es une IA.
4. Signe avec le nom de l'expéditeur et l'entreprise uniquement s'ils sont fournis, sinon termine par [Votre nom].
5. Chaque message doit tenir en moins de 150 mots (sauf la version courte : moins de 60 mots).

Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"variants":[{"style":"professionnel","subject":"...","body":"..."},{"style":"amical","subject":"...","body":"..."},{"style":"court","subject":"...","body":"..."}]}
Le champ "subject" est un objet d'email court. Le champ "body" contient le message avec des retours à la ligne (\\n).`;

export function buildUserPrompt(req: AiRequest): string {
  const lines = [
    `Nom du client : ${req.clientName}`,
    `Type de message : ${MESSAGE_TYPE_LABELS[req.messageType]}`,
    `Ton général souhaité : ${TONE_LABELS[req.tone]}`,
    `Contexte de la relation : ${req.context || "(non précisé)"}`,
    `Informations sur le devis : ${req.quoteInfo || "(aucune information de devis fournie — ne mentionne aucun montant ni date)"}`,
    `Nom de l'expéditeur : ${req.senderName || "(non fourni)"}`,
    `Entreprise de l'expéditeur : ${req.companyName || "(non fournie)"}`,
    "",
    "Rédige les trois variantes demandées (professionnelle, amicale, courte et directe) en respectant strictement les règles.",
  ];
  return lines.join("\n");
}

/** Extrait et valide la réponse JSON du modèle. Renvoie null si le format est inattendu. */
export function parseVariants(raw: string): AiVariant[] | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!json || typeof json !== "object" || !Array.isArray((json as { variants?: unknown }).variants)) return null;
  const variants = (json as { variants: unknown[] }).variants;
  const out: AiVariant[] = [];
  for (const style of ["professionnel", "amical", "court"] as const) {
    const found = variants.find((v) => v && typeof v === "object" && (v as { style?: unknown }).style === style) as
      | { subject?: unknown; body?: unknown }
      | undefined;
    if (!found || typeof found.body !== "string" || found.body.trim() === "") return null;
    out.push({
      style,
      label: VARIANT_LABELS[style],
      subject: typeof found.subject === "string" ? found.subject.trim().slice(0, 200) : "",
      body: found.body.trim().slice(0, 3000),
    });
  }
  return out;
}
