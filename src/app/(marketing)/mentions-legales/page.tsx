import type { Metadata } from "next";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site Relanceo AI est édité par <Placeholder>raison sociale ou nom et prénom</Placeholder>, <Placeholder>forme juridique et capital</Placeholder>, dont le
        siège est situé <Placeholder>adresse complète</Placeholder>, immatriculée sous le numéro <Placeholder>SIREN / RCS</Placeholder>.
      </p>
      <p>
        Directeur de la publication : <Placeholder>nom</Placeholder>. Contact : <Placeholder>adresse email</Placeholder>.
      </p>
      <h2>Hébergement</h2>
      <p>
        Application hébergée par <Placeholder>hébergeur, ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</Placeholder>. Base de données et
        authentification fournies par <Placeholder>Supabase Inc., avec la région de stockage choisie</Placeholder>.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments du site (textes, interface, logo) est protégé par le droit d'auteur. Toute reproduction non autorisée est interdite. Les données que
        vous saisissez restent votre propriété.
      </p>
      <h2>Responsabilité</h2>
      <p>
        Relanceo AI est un outil d'aide au suivi commercial. Les messages proposés par l'assistant doivent être relus avant envoi ; l'éditeur ne saurait être tenu
        responsable du contenu des messages envoyés par les utilisateurs à leurs clients.
      </p>
    </LegalPage>
  );
}
