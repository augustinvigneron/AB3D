import type { AiRequest } from "@/lib/validation/schemas";
import { VARIANT_LABELS, type AiVariant } from "./prompt";

/**
 * Démonstration locale, sans modèle d'IA : assemble des gabarits à partir des
 * seules données fournies. Aucune information n'est inventée.
 * Utilisée uniquement quand aucune clé d'API n'est configurée.
 */
export function simulateVariants(req: AiRequest): AiVariant[] {
  const signature = [req.senderName, req.companyName].filter(Boolean).join(" — ") || "[Votre nom]";
  const quoteLine = req.quoteInfo ? `Pour rappel : ${req.quoteInfo}.` : "";
  const contextLine = req.context ? `Contexte : ${req.context}.` : "";

  const subjects: Record<AiRequest["messageType"], string> = {
    relance_devis: "Suite à notre devis",
    prise_de_nouvelles: "Prise de nouvelles",
    remerciement: "Merci pour votre confiance",
    rappel_rdv: "Rappel de notre rendez-vous",
    autre: "Petit message",
  };

  const intros: Record<AiRequest["messageType"], { pro: string; amical: string; court: string }> = {
    relance_devis: {
      pro: "Je me permets de revenir vers vous au sujet du devis que je vous ai transmis. Avez-vous eu l'occasion de l'examiner ?",
      amical: "J'espère que vous allez bien ! Je voulais savoir si vous aviez pu jeter un œil au devis que je vous ai envoyé.",
      court: "Avez-vous pu consulter le devis ? Je reste disponible pour toute question.",
    },
    prise_de_nouvelles: {
      pro: "Je me permets de prendre de vos nouvelles concernant votre projet. Je reste à votre disposition si vous souhaitez en discuter.",
      amical: "J'espère que tout va bien de votre côté ! Je voulais simplement prendre de vos nouvelles au sujet de votre projet.",
      court: "Où en est votre projet ? Je suis disponible si besoin.",
    },
    remerciement: {
      pro: "Je tenais à vous remercier pour votre confiance. N'hésitez pas à me recontacter pour tout besoin futur.",
      amical: "Un grand merci pour votre confiance ! Ce fut un plaisir de travailler avec vous.",
      court: "Merci pour votre confiance. À bientôt !",
    },
    rappel_rdv: {
      pro: "Je vous confirme notre rendez-vous à venir. Merci de me prévenir en cas d'empêchement.",
      amical: "Petit rappel pour notre rendez-vous à venir — hâte d'échanger avec vous !",
      court: "Rappel de notre rendez-vous. Dites-moi si quelque chose change.",
    },
    autre: {
      pro: "Je me permets de vous contacter à la suite de nos échanges.",
      amical: "J'espère que vous allez bien ! Je reviens vers vous à la suite de nos échanges.",
      court: "Je reviens vers vous suite à nos échanges.",
    },
  };

  const i = intros[req.messageType];
  const join = (...parts: string[]) => parts.filter(Boolean).join("\n\n");

  return [
    {
      style: "professionnel",
      label: VARIANT_LABELS.professionnel,
      subject: subjects[req.messageType],
      body: join(`Bonjour ${req.clientName},`, i.pro, quoteLine, contextLine, "Je reste à votre disposition pour tout complément d'information.", `Cordialement,\n${signature}`),
    },
    {
      style: "amical",
      label: VARIANT_LABELS.amical,
      subject: subjects[req.messageType],
      body: join(`Bonjour ${req.clientName},`, i.amical, quoteLine, contextLine, "N'hésitez pas à me faire signe si vous avez la moindre question !", `Bonne journée,\n${signature}`),
    },
    {
      style: "court",
      label: VARIANT_LABELS.court,
      subject: subjects[req.messageType],
      body: join(`Bonjour ${req.clientName},`, i.court, quoteLine, `${signature}`),
    },
  ];
}
