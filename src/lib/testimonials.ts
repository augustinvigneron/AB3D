/**
 * Avis clients affichés sur la page d'accueil.
 *
 * ⚠️ RÈGLE ABSOLUE : uniquement des avis RÉELS.
 * - La personne a réellement utilisé Nexora.
 * - Elle vous a donné son accord écrit (email, SMS) pour publier son avis et son nom.
 * - Vous conservez cette preuve d'accord.
 * - Vous ne modifiez pas le sens de ce qu'elle a dit.
 * Publier de faux avis est une pratique commerciale trompeuse (Code de la consommation),
 * passible d'amende et de prison.
 *
 * Tant que cette liste est vide, la section « Avis » n'apparaît pas sur le site.
 *
 * Exemple d'avis à ajouter entre les crochets ci-dessous :
 *   {
 *     name: "Marie D.",
 *     job: "Plombière",
 *     city: "Nantes",
 *     quote: "Le texte exact de son avis.",
 *     date: "2026-11",
 *   },
 */
export type Testimonial = {
  /** Prénom + initiale du nom, avec l'accord de la personne. */
  name: string;
  /** Métier, ex. « Électricien ». */
  job: string;
  /** Ville (facultatif). */
  city?: string;
  /** Avis mot pour mot. */
  quote: string;
  /** Mois de l'avis au format AAAA-MM. */
  date: string;
};

export const TESTIMONIALS: Testimonial[] = [];
