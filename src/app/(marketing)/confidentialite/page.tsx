import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Fill } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p>
        Cette politique explique quelles données Follow IA traite, pourquoi, combien de temps, avec qui elles sont partagées et comment exercer vos droits. Elle
        s'applique au site et à l'application Follow IA.
      </p>

      <h2>1. Qui est responsable de vos données ?</h2>
      <p>
        Le responsable du traitement est <Fill field="editorName" />, <Fill field="editorStatus" />, <Fill field="address" />, SIREN <Fill field="siren" />.
      </p>
      <p>
        Pour toute question ou pour exercer vos droits : <Fill field="email" />.
      </p>
      <p>Follow IA intervient à deux titres différents :</p>
      <ul>
        <li>
          <strong>Responsable de traitement</strong> pour les données de votre compte (identité, connexion, abonnement).
        </li>
        <li>
          <strong>Sous-traitant</strong> pour les données de <em>vos</em> clients que vous enregistrez dans l'application (noms, coordonnées, devis, relances). Pour
          ces données, c'est vous le responsable de traitement ; nos engagements sont décrits à l'article 7 des{" "}
          <Link href="/conditions-utilisation">conditions d'utilisation</Link>.
        </li>
      </ul>

      <h2>2. Quelles données, pourquoi, et sur quelle base ?</h2>
      <h3>Données de votre compte</h3>
      <ul>
        <li>
          <strong>Inscription par email :</strong> adresse email, mot de passe (enregistré uniquement sous forme chiffrée par un algorithme de hachage : personne, y
          compris nous, ne peut le lire), nom, nom d'entreprise (facultatif).
        </li>
        <li>
          <strong>Inscription avec Google</strong> (si vous choisissez cette option) : nom, adresse email, photo de profil et identifiant de compte transmis par
          Google.
        </li>
        <li>
          <strong>Préférences d'affichage</strong> que vous choisissez dans les paramètres.
        </li>
      </ul>
      <p>
        Finalité : créer et sécuriser votre compte, vous permettre d'utiliser le service. Base légale : exécution du contrat (les conditions d'utilisation que vous
        acceptez à l'inscription).
      </p>

      <h3>Contenu que vous saisissez</h3>
      <p>
        Clients (nom, entreprise, email, téléphone, notes, statut, dates de contact et de relance), devis (titre, montant, dates, statut), relances et historique de
        vos actions sur les relances. Finalité : fournir le service. Base légale : exécution du contrat.
      </p>

      <h3>Utilisation de l'assistant de rédaction</h3>
      <p>
        Par défaut, les messages sont rédigés sur nos serveurs à partir de modèles de phrases : <strong>aucune donnée n'est transmise à un service extérieur</strong>{" "}
        et rien n'est conservé en dehors de votre compte. Si un service d'intelligence artificielle est un jour utilisé pour rédiger les messages, cette politique
        sera mise à jour avant sa mise en service pour indiquer le prestataire et les données transmises ; nous enregistrons alors la date de chaque génération pour
        appliquer les limites de votre offre.
      </p>

      <h3>Abonnement et paiement</h3>
      <p>
        Si vous souscrivez une offre payante, le paiement est traité par Stripe. Nous ne recevons ni ne conservons jamais votre numéro de carte : nous enregistrons
        uniquement les identifiants techniques de votre client et de votre abonnement Stripe, l'offre choisie, le statut de l'abonnement et sa date d'échéance.
        Base légale : exécution du contrat et respect de nos obligations comptables et fiscales.
      </p>

      <h3>Données techniques</h3>
      <p>
        Lors de vos visites, notre hébergeur enregistre automatiquement des journaux techniques (adresse IP, date et heure, page demandée, type de navigateur).
        Finalité : assurer la sécurité et le bon fonctionnement du service, diagnostiquer les erreurs. Base légale : notre intérêt légitime à protéger le service.
      </p>

      <h3>Ce que nous ne faisons pas</h3>
      <ul>
        <li>Aucune publicité, aucun traceur publicitaire, aucun outil de mesure d'audience tiers.</li>
        <li>Aucune revente ni location de données.</li>
        <li>Aucun profilage ni décision automatisée produisant des effets juridiques à votre égard.</li>
        <li>Aucun envoi de message à vos clients : l'application rédige des propositions, c'est vous qui envoyez.</li>
      </ul>

      <h2>3. Cookies</h2>
      <p>
        Follow IA n'utilise que des <strong>cookies strictement nécessaires</strong> : les cookies de session qui vous gardent connecté de manière sécurisée. Ils sont
        exemptés de consentement (article 82 de la loi Informatique et Libertés), c'est pourquoi aucun bandeau ne vous est demandé.
      </p>
      <p>
        Si vous utilisez le bouton « Continuer avec Google », Google peut déposer ses propres cookies au moment où vous l'utilisez ; ils relèvent de la{" "}
        <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">
          politique de confidentialité de Google
        </a>
        .
      </p>

      <h2>4. Qui a accès à vos données ?</h2>
      <p>
        Vos données ne sont accessibles qu'à vous : chaque compte est isolé au niveau de la base de données. Nous n'y accédons que si c'est nécessaire au support
        que vous demandez, à la sécurité du service ou au respect d'une obligation légale.
      </p>
      <p>Nous faisons appel aux prestataires (sous-traitants) suivants, liés par contrat et tenus à la confidentialité :</p>
      <ul>
        <li>
          <strong>Supabase</strong> : base de données, authentification et envoi des emails de compte (confirmation, mot de passe oublié). Région d'hébergement des
          données : <Fill field="databaseRegion" />.
        </li>
        <li>
          <strong>Vercel Inc.</strong> (États-Unis) : hébergement et exécution de l'application.
        </li>
        <li>
          <strong>Stripe</strong> : paiement des abonnements, uniquement si vous souscrivez une offre payante.
        </li>
        <li>
          <strong>Google</strong> : connexion avec un compte Google, uniquement si vous choisissez cette option.
        </li>
      </ul>
      <p>
        Certains de ces prestataires sont établis aux États-Unis ou y ont une société mère. Ces transferts hors de l'Union européenne sont encadrés par les clauses
        contractuelles types adoptées par la Commission européenne et, le cas échéant, par le cadre de protection des données UE–États-Unis (Data Privacy
        Framework).
      </p>

      <h2>5. Combien de temps les conservons-nous ?</h2>
      <ul>
        <li>
          <strong>Compte et contenu</strong> (clients, devis, relances, historique, préférences) : tant que votre compte existe. Quand vous supprimez votre compte
          depuis Paramètres, ces données sont <strong>effacées immédiatement et définitivement</strong> de la base de données.
        </li>
        <li>
          <strong>Sauvegardes techniques</strong> de l'hébergeur de la base de données : elles peuvent contenir vos données jusqu'à leur écrasement automatique, selon
          le cycle de rotation de ce prestataire.
        </li>
        <li>
          <strong>Factures et pièces comptables</strong> liées à un abonnement payant : 10 ans, durée imposée par le Code de commerce (article L123-22).
        </li>
        <li>
          <strong>Journaux techniques</strong> : durée courte fixée par l'hébergeur, le temps nécessaire au diagnostic et à la sécurité.
        </li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>Vous disposez des droits suivants sur vos données :</p>
      <ul>
        <li>
          <strong>Accès et portabilité</strong> : téléchargez toutes vos données au format JSON depuis Paramètres → « Exporter mes données ».
        </li>
        <li>
          <strong>Rectification</strong> : modifiez votre profil, vos clients, devis et relances directement dans l'application.
        </li>
        <li>
          <strong>Effacement</strong> : supprimez votre compte et toutes vos données depuis Paramètres → « Supprimer le compte ».
        </li>
        <li>
          <strong>Opposition et limitation</strong> du traitement, dans les cas prévus par le RGPD.
        </li>
        <li>
          <strong>Directives post-mortem</strong> : définir ce que deviennent vos données après votre décès.
        </li>
      </ul>
      <p>
        Pour toute demande qui ne peut pas être faite directement dans l'application, écrivez à <Fill field="email" />. Nous répondons dans un délai d'un mois.
        Nous pouvons vous demander de justifier de votre identité en cas de doute raisonnable.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
        ).
      </p>

      <h2>7. Sécurité</h2>
      <ul>
        <li>Connexions chiffrées (HTTPS) sur tout le site.</li>
        <li>Mots de passe enregistrés uniquement sous forme hachée.</li>
        <li>Isolation des données de chaque compte au niveau de la base (« Row Level Security ») : un utilisateur ne peut techniquement pas lire les données d'un autre.</li>
        <li>Clés d'accès privilégiées conservées uniquement sur le serveur, jamais dans votre navigateur.</li>
      </ul>
      <p>
        En cas de violation de données présentant un risque pour vos droits, nous notifierons la CNIL dans les 72 heures et vous informerons si la loi l'exige.
      </p>

      <h2>8. Modifications</h2>
      <p>
        Nous pouvons faire évoluer cette politique, par exemple si le service change de prestataire. En cas de changement important, vous serez prévenu par email ou
        dans l'application avant son entrée en vigueur. La date de dernière mise à jour figure en haut de cette page.
      </p>
    </LegalPage>
  );
}
