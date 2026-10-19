import type { Metadata } from "next";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="octobre 2026">
      <p>
        Cette politique décrit les données traitées par Follow IA et vos droits. Elle doit être complétée et validée avant toute mise en production (responsable de
        traitement, durées de conservation, sous-traitants exacts).
      </p>
      <h2>Responsable du traitement</h2>
      <p>
        <Placeholder>identité et coordonnées du responsable de traitement</Placeholder>. Contact pour l'exercice de vos droits : <Placeholder>adresse email dédiée</Placeholder>.
      </p>
      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Données de compte :</strong> adresse email, mot de passe (haché par notre prestataire d'authentification), nom, nom d'entreprise facultatif.
        </li>
        <li>
          <strong>Données que vous saisissez :</strong> informations sur vos clients (nom, entreprise, email, téléphone, notes, statut, dates), devis (titre, montant,
          dates, statut) et relances.
        </li>
        <li>
          <strong>Données d'usage :</strong> nombre de générations IA par mois (pour appliquer les quotas) et historique des actions sur vos relances.
        </li>
        <li>
          <strong>Données de paiement :</strong> si vous souscrivez une offre payante, le paiement est traité par Stripe ; nous ne stockons que des identifiants
          techniques (client, abonnement), jamais votre numéro de carte.
        </li>
      </ul>
      <p>Nous ne collectons que les données nécessaires au fonctionnement du service. Aucun traceur publicitaire n'est utilisé.</p>
      <h2>Vos clients et le RGPD</h2>
      <p>
        Vous saisissez des informations sur vos propres clients : vous en êtes le responsable de traitement et nous agissons comme sous-traitant. Il vous appartient
        d'informer vos clients et de ne saisir que les données utiles.
      </p>
      <h2>Assistant de rédaction</h2>
      <p>
        Par défaut, les messages sont rédigés sur nos serveurs à partir de modèles de phrases : aucune donnée n'est transmise à un service extérieur. Si l'éditeur
        active un fournisseur d'intelligence artificielle, les informations saisies dans le formulaire (nom du client, contexte, informations sur le devis, votre nom
        et entreprise) lui sont transmises pour rédiger les messages : <Placeholder>nom du fournisseur et lien vers sa politique, si activé</Placeholder>.
      </p>
      <h2>Finalités et base légale</h2>
      <p>Exécution du contrat (fourniture du service), respect d'obligations légales (facturation) et intérêt légitime (sécurité, prévention des abus).</p>
      <h2>Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. La suppression du compte efface immédiatement l'ensemble de vos données applicatives.{" "}
        <Placeholder>préciser la durée de conservation des sauvegardes et des données de facturation</Placeholder>.
      </p>
      <h2>Sous-traitants</h2>
      <ul>
        <li>Supabase (authentification et base de données) — <Placeholder>région d'hébergement</Placeholder></li>
        <li>
          <Placeholder>hébergeur de l'application</Placeholder>
        </li>
        <li>Stripe (paiements, le cas échéant)</li>
        <li>
          <Placeholder>fournisseur d'IA</Placeholder> (génération de messages, le cas échéant)
        </li>
      </ul>
      <h2>Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. Depuis la page Paramètres, vous pouvez exporter toutes vos
        données (JSON) et supprimer votre compte. Pour toute autre demande, écrivez à l'adresse ci-dessus. Vous pouvez introduire une réclamation auprès de la CNIL.
      </p>
      <h2>Sécurité</h2>
      <p>
        Les données sont isolées par compte grâce à des politiques de sécurité au niveau de la base (Row Level Security). Les échanges sont chiffrés (HTTPS). Aucune clé
        privilégiée n'est exposée au navigateur.
      </p>
    </LegalPage>
  );
}
