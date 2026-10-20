/**
 * Informations légales de l'éditeur, utilisées par les pages Mentions légales,
 * Politique de confidentialité et Conditions d'utilisation.
 *
 * ⚠️ À REMPLIR AVANT D'OUVRIR LE SITE AU PUBLIC. Ces informations sont
 * obligatoires (loi pour la confiance dans l'économie numérique, RGPD).
 * Tant qu'un champ est vide, la page affiche un encadré « À compléter ».
 * Ne mettez que des informations exactes.
 */
export const LEGAL = {
  /** Nom et prénom (entrepreneur individuel) ou raison sociale (société). Ex. : « Jean Dupont » ou « Nexora SAS ». */
  editorName: "Nexora",
  /** Statut juridique, une fois l'entreprise immatriculée. Ex. : « SAS au capital de 1 000 € ». Vide = non affiché. */
  editorStatus: "",
  /** Adresse postale complète de l'entreprise (ou de domiciliation). */
  address: "45 rue Nadar, 92500 Rueil-Malmaison, France",
  /** Numéro SIREN (9 chiffres) ; ajoutez « RCS Ville » ou « RNE » selon le cas. */
  siren: "",
  /** Email de contact, utilisé aussi pour les demandes RGPD. */
  email: "augustinvigneron767@gmail.com",
  /** Directeur de la publication (en général l'entrepreneur ou le président de la société). */
  publicationDirector: "Augustin Vigneron",
  /** Région du projet Supabase (Supabase → Project Settings → General). Ex. : « Union européenne (Paris) ». */
  databaseRegion: "États-Unis (Virginie du Nord, us-east-1)",
  /** Ville du siège, pour la juridiction compétente. */
  courtCity: "Nanterre (siège à Rueil-Malmaison)",
  /** Date affichée en haut des pages légales. */
  lastUpdated: "20 octobre 2026",
};

export type LegalField = Exclude<keyof typeof LEGAL, "lastUpdated">;

/** Liste des champs encore vides (utile pour vérifier avant la mise en ligne). */
export function missingLegalFields(): LegalField[] {
  return (Object.keys(LEGAL) as Array<keyof typeof LEGAL>).filter(
    (k): k is LegalField => k !== "lastUpdated" && k !== "editorStatus" && LEGAL[k].trim() === "",
  );
}
