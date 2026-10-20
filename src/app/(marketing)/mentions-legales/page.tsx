import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Fill, Placeholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site Nuvarex est édité par <Fill field="editorName" /><Fill field="editorStatus" optional prefix=", " />.
        <br />
        Adresse : <Fill field="address" />
        <br />
        SIREN : <Fill field="siren" />
        <br />
        Contact : <Fill field="email" />
      </p>
      <p>
        Directeur de la publication : <Fill field="publicationDirector" />.
      </p>

      <h2>Hébergement</h2>
      <p>
        Application hébergée par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com. Téléphone :{" "}
        <Placeholder>numéro de téléphone de l'hébergeur, indiqué dans ses conditions</Placeholder>.
      </p>
      <p>
        Base de données et authentification fournies par Supabase (supabase.com), région d'hébergement : <Fill field="databaseRegion" />.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments du site (textes, interface, logo) est protégé par le droit d'auteur. Toute reproduction ou réutilisation sans autorisation est
        interdite. Les données que vous saisissez dans l'application restent votre propriété.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Nuvarex est un outil d'aide au suivi commercial. Les messages proposés doivent être relus avant envoi ; l'éditeur ne saurait être tenu responsable du
        contenu des messages envoyés par les utilisateurs à leurs clients. Voir les <Link href="/conditions-utilisation">conditions d'utilisation</Link>.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
