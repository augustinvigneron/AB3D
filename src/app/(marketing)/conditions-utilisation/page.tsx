import type { Metadata } from "next";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="octobre 2026">
      <h2>1. Objet</h2>
      <p>
        Relanceo AI est un service en ligne d'aide au suivi commercial destiné aux artisans et indépendants : gestion de contacts clients, suivi de devis, planification
        de relances et aide à la rédaction de messages. Les présentes conditions régissent son utilisation.
      </p>
      <h2>2. Compte</h2>
      <p>
        L'inscription nécessite une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de l'ensemble des actions réalisées depuis
        votre compte.
      </p>
      <h2>3. Offres et quotas</h2>
      <p>
        L'offre Gratuite est limitée à 10 clients et 5 générations IA par mois. Les offres Pro (12 €/mois) et Business (24 €/mois) donnent accès respectivement à 100
        et 300 générations IA par mois. Les quotas se réinitialisent au début de chaque mois civil. L'activation d'une offre payante n'intervient qu'après
        confirmation du paiement par notre prestataire. <Placeholder>conditions de résiliation, remboursement et modification des prix</Placeholder>.
      </p>
      <h2>4. Assistant IA</h2>
      <p>
        Les messages proposés sont des suggestions générées automatiquement à partir des informations que vous fournissez. Ils peuvent contenir des erreurs. Vous
        devez les relire et les modifier avant tout envoi. Le service n'envoie aucun message à votre place.
      </p>
      <h2>5. Ce que le service n'est pas</h2>
      <p>
        Relanceo AI n'est pas un logiciel de facturation : le module « Devis » ne produit pas de documents conformes à la réglementation comptable ou fiscale.
      </p>
      <h2>6. Usage acceptable</h2>
      <p>
        Vous vous engagez à n'utiliser le service que pour des relances légitimes auprès de vos propres clients et prospects, dans le respect de la réglementation sur
        la prospection commerciale, et à ne pas y saisir de données sensibles.
      </p>
      <h2>7. Disponibilité et responsabilité</h2>
      <p>
        Le service est fourni « en l'état ». L'éditeur s'efforce d'en assurer la disponibilité mais ne garantit pas l'absence d'interruptions. Sa responsabilité ne
        saurait être engagée pour les pertes indirectes (perte de chiffre d'affaires, de clientèle).
      </p>
      <h2>8. Données</h2>
      <p>
        Le traitement des données est décrit dans la politique de confidentialité. Vous pouvez exporter vos données et supprimer votre compte à tout moment.
      </p>
      <h2>9. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. <Placeholder>tribunal compétent et médiateur de la consommation le cas échéant</Placeholder>.
      </p>
    </LegalPage>
  );
}
