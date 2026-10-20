import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Fill } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <h2>1. Objet et acceptation</h2>
      <p>
        Les présentes conditions encadrent l'utilisation du service Nexora, édité par <Fill field="editorName" /> (voir les{" "}
        <Link href="/mentions-legales">mentions légales</Link>). En créant un compte, vous les acceptez sans réserve. Si vous n'êtes pas d'accord, n'utilisez pas le
        service.
      </p>

      <h2>2. Un service destiné aux professionnels</h2>
      <p>
        Nexora s'adresse aux professionnels — artisans, indépendants, très petites entreprises — qui l'utilisent pour leur activité. En vous inscrivant, vous
        déclarez agir à des fins professionnelles. Le service n'est pas destiné aux particuliers agissant pour leurs besoins personnels.
      </p>

      <h2>3. Votre compte</h2>
      <ul>
        <li>L'inscription se fait avec une adresse email valide ou un compte Google. Les informations fournies doivent être exactes.</li>
        <li>
          Vos identifiants sont personnels. Vous êtes responsable de leur confidentialité et des actions réalisées depuis votre compte. Prévenez-nous sans délai à{" "}
          <Fill field="email" /> si vous soupçonnez une utilisation frauduleuse.
        </li>
        <li>Un compte correspond à un utilisateur. Le partage d'un compte entre plusieurs personnes n'est pas autorisé.</li>
      </ul>

      <h2>4. Description du service</h2>
      <p>Nexora vous permet notamment :</p>
      <ul>
        <li>de tenir un fichier de clients et de prospects ;</li>
        <li>
          de suivre vos devis (titre, montant, dates, statut). Ce module sert au <strong>suivi commercial uniquement</strong> : il ne produit ni devis ni factures
          conformes aux obligations comptables ou fiscales et ne remplace pas un logiciel de facturation ;
        </li>
        <li>de planifier vos relances et de consulter ce qui est à faire aujourd'hui, en retard ou à venir ;</li>
        <li>
          d'obtenir des propositions de messages de relance, rédigées à partir de modèles et des informations que vous saisissez. Le service{" "}
          <strong>n'envoie aucun message à votre place</strong> ;
        </li>
        <li>d'exporter vos données et de supprimer votre compte à tout moment.</li>
      </ul>
      <p>Le service peut évoluer : des fonctionnalités peuvent être ajoutées, modifiées ou retirées, sans réduire de manière substantielle ce qui a été payé.</p>

      <h2>5. Offres, prix et paiement</h2>
      <ul>
        <li>
          Une <strong>offre gratuite</strong> est proposée, avec les limites indiquées sur la page <Link href="/#tarifs">Tarifs</Link> (nombre de clients et
          nombre de générations de messages par mois).
        </li>
        <li>
          Les <strong>offres payantes</strong> sont des abonnements mensuels, au prix affiché sur la page Tarifs au moment de la souscription. Le paiement est
          effectué par carte via notre prestataire Stripe. Une offre payante n'est activée qu'après confirmation du paiement.
        </li>
        <li>
          L'abonnement est <strong>reconduit automatiquement chaque mois</strong>. Vous pouvez le résilier à tout moment depuis Paramètres → Abonnement → « Gérer mon
          abonnement ». La résiliation prend effet à la fin de la période mensuelle en cours ; le mois commencé reste dû et n'est pas remboursé au prorata. Votre
          compte repasse ensuite sur l'offre gratuite, sans perte de données.
        </li>
        <li>En cas d'échec de paiement, l'offre payante peut être suspendue puis le compte repasser sur l'offre gratuite.</li>
        <li>Toute modification de prix vous est annoncée au moins 30 jours à l'avance ; vous pouvez résilier avant son entrée en vigueur.</li>
      </ul>

      <h2>6. Vos engagements</h2>
      <p>Vous vous engagez à :</p>
      <ul>
        <li>utiliser le service conformément à la loi et uniquement pour votre activité professionnelle ;</li>
        <li>
          ne contacter que vos propres clients et prospects, dans le respect des règles de prospection commerciale (RGPD, Code des postes et des communications
          électroniques) et, pour le démarchage téléphonique de particuliers, de la liste d'opposition Bloctel ;
        </li>
        <li>
          ne pas enregistrer de données sensibles (santé, opinions politiques ou religieuses, etc.) ni de données de paiement de vos clients dans les champs libres ;
        </li>
        <li>relire et, si besoin, corriger chaque message proposé avant de l'envoyer : vous restez seul responsable de ce que vous envoyez ;</li>
        <li>ne pas tenter d'accéder aux données d'autres utilisateurs, de perturber le service ou de le copier.</li>
      </ul>

      <h2>7. Les données de vos clients (sous-traitance)</h2>
      <p>
        Pour les données de vos clients et prospects que vous enregistrez, <strong>vous êtes le responsable de traitement</strong> et Nexora agit en tant que{" "}
        <strong>sous-traitant</strong> au sens de l'article 28 du RGPD. À ce titre, l'éditeur s'engage à :
      </p>
      <ul>
        <li>ne traiter ces données que pour fournir le service, selon vos instructions résultant de votre utilisation de l'application ;</li>
        <li>en garantir la confidentialité, y compris par les personnes autorisées à y accéder ;</li>
        <li>mettre en œuvre les mesures de sécurité décrites dans la <Link href="/confidentialite">politique de confidentialité</Link> ;</li>
        <li>
          ne faire appel qu'aux sous-traitants listés dans cette politique, et vous informer de tout changement afin que vous puissiez vous y opposer en résiliant ;
        </li>
        <li>vous aider à répondre aux demandes de vos propres clients (accès, rectification, effacement), notamment grâce à l'export et à la suppression ;</li>
        <li>vous notifier toute violation de ces données dans les meilleurs délais après en avoir pris connaissance ;</li>
        <li>supprimer ces données à la suppression de votre compte ;</li>
        <li>mettre à votre disposition les informations nécessaires pour démontrer le respect de ces obligations.</li>
      </ul>
      <p>
        De votre côté, vous vous engagez à ne collecter que les données utiles à votre relation commerciale et à informer vos clients de leur traitement.
      </p>

      <h2>8. Propriété</h2>
      <ul>
        <li>Le service (logiciel, interface, textes, logo) appartient à l'éditeur. Vous bénéficiez d'un droit d'utilisation personnel, non exclusif et non cessible.</li>
        <li>
          <strong>Vos données restent les vôtres.</strong> Vous nous autorisez seulement à les héberger et à les traiter dans la mesure nécessaire au fonctionnement
          du service.
        </li>
        <li>Les messages proposés par l'assistant sont librement utilisables par vous.</li>
      </ul>

      <h2>9. Disponibilité</h2>
      <p>
        L'éditeur s'efforce de rendre le service accessible en permanence, sans pouvoir le garantir : des interruptions peuvent survenir pour maintenance, mise à
        jour ou panne d'un prestataire. Il s'agit d'une obligation de moyens. Pensez à exporter régulièrement vos données.
      </p>

      <h2>10. Responsabilité</h2>
      <ul>
        <li>L'éditeur n'est pas responsable du contenu des messages que vous envoyez, ni des décisions commerciales que vous prenez à l'aide du service.</li>
        <li>
          L'éditeur ne peut être tenu responsable des dommages indirects (perte de chiffre d'affaires, de clientèle ou de données non exportées, par exemple).
        </li>
        <li>
          Sauf faute lourde ou intentionnelle, la responsabilité de l'éditeur est limitée au montant que vous avez payé pour le service au cours des 12 mois précédant
          l'événement en cause.
        </li>
      </ul>

      <h2>11. Suspension et fin du contrat</h2>
      <ul>
        <li>Vous pouvez supprimer votre compte à tout moment depuis Paramètres ; vos données sont alors effacées.</li>
        <li>
          En cas de manquement grave à ces conditions (fraude, atteinte à la sécurité, usage illicite), l'éditeur peut suspendre ou fermer votre compte, après vous
          en avoir informé sauf urgence.
        </li>
        <li>
          Si l'éditeur décide d'arrêter le service, vous en serez informé au moins 30 jours à l'avance afin de pouvoir exporter vos données ; les sommes payées pour
          la période non utilisée vous seront remboursées.
        </li>
      </ul>

      <h2>12. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. Toute modification importante vous est annoncée par email ou dans l'application au moins 30 jours avant son entrée en
        vigueur. Si vous ne l'acceptez pas, vous pouvez résilier avant cette date ; à défaut, la poursuite de l'utilisation vaut acceptation.
      </p>

      <h2>13. Droit applicable et litiges</h2>
      <p>
        Ces conditions sont soumises au droit français. En cas de difficulté, contactez-nous d'abord à <Fill field="email" /> : nous chercherons une solution
        amiable. À défaut, le litige sera porté devant les tribunaux compétents du ressort de <Fill field="courtCity" />, sous réserve des règles de compétence
        d'ordre public.
      </p>
    </LegalPage>
  );
}
