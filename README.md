# Follow IA

SaaS de suivi client et de relances commerciales pour artisans et indépendants, avec un assistant IA qui rédige les messages (vous relisez, vous envoyez).

- **Stack** : Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (auth + Postgres + RLS), API IA configurable côté serveur (Anthropic ou OpenAI), Stripe (préparé, non activé).
- **Langue** : toute l'interface est en français.
- **Philosophie** : aucune clé secrète côté navigateur, validation serveur systématique (Zod), isolation des données par utilisateur (Row Level Security).

---

## 1. Démarrer en 5 minutes

Prérequis : Node.js 20 ou plus (22 recommandé), npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrez <http://localhost:3000>.

**Sans configuration**, la landing, les pages légales et la **démonstration** (`/demo`, données fictives) fonctionnent. Les pages privées renvoient vers `/configuration-requise` tant que Supabase n'est pas renseigné.

## 2. Configurer Supabase (obligatoire pour l'auth et les données)

1. Créez un projet sur <https://supabase.com> (offre gratuite suffisante).
2. Dans le tableau de bord : **SQL Editor → New query**, collez le contenu de `supabase/migrations/0001_init.sql`, puis **Run**. Cela crée les tables, les déclencheurs, les quotas et les politiques RLS.
3. **Settings → API** : copiez l'URL du projet et la clé publique (« publishable » `sb_publishable_…`, ou l'ancienne clé « anon » — les deux fonctionnent).
4. Dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
5. **Authentication → URL Configuration** : ajoutez `http://localhost:3000/auth/callback` (et plus tard l'URL de production) dans *Redirect URLs*.
6. Redémarrez `npm run dev`, créez un compte sur `/inscription`.

### Modèles d'email (recommandé)

Par défaut, Supabase envoie des liens au format PKCE qui ne fonctionnent que dans le navigateur ayant fait la demande. Pour que les liens marchent depuis n'importe quel appareil, modifiez dans **Authentication → Email Templates** :

- *Confirm signup* : remplacez le lien par
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/dashboard`
- *Reset password* :
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`

Le fichier `src/app/auth/callback/route.ts` accepte les deux formats.

> Pendant le développement, vous pouvez désactiver « Confirm email » dans *Authentication → Providers → Email* pour vous connecter immédiatement après l'inscription.

### Connexion avec Google (optionnel)

Le bouton « Continuer avec Google » apparaît **automatiquement** sur les pages Connexion et Inscription dès que Google est activé dans Supabase (vérification toutes les 5 minutes). Tant que ce n'est pas fait, il reste caché : aucun bouton ne mène à une erreur.

1. **Google Cloud Console** (console.cloud.google.com) → créez un projet → *APIs & Services* → *OAuth consent screen* : type « External », nom « Follow IA », votre email.
2. *Credentials* → *Create credentials* → *OAuth client ID* → type **Web application**.
   - *Authorized redirect URIs* : `https://<votre-projet>.supabase.co/auth/v1/callback` (l'URL exacte est affichée dans Supabase, étape 3).
3. **Supabase** → *Authentication* → *Sign In / Providers* → **Google** → activez, collez le *Client ID* et le *Client Secret* → Save.
4. **Supabase** → *Authentication* → *URL Configuration* → *Redirect URLs* : ajoutez `https://votre-domaine/**`.

**Bouton officiel Google (recommandé)** : renseignez `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (l'ID client, pas le secret) dans Vercel puis redéployez, et ajoutez l'adresse du site dans *Credentials* → votre client → *Authorized JavaScript origins*. Google affiche alors l'adresse du site au lieu de `….supabase.co` ; le nom et le logo n'apparaissent qu'après la vérification de la marque par Google (domaine à vous requis). Sans cette variable, le bouton utilise la redirection OAuth classique.

Le premier clic sur le bouton crée le compte (le nom vient du profil Google) ; les suivants connectent.

## 3. Configurer l'assistant IA (optionnel)

Sans clé, l'assistant fonctionne en **mode simulation** clairement signalé : des gabarits locaux, aucun modèle d'IA, aucune donnée ne quitte le serveur.

Pour activer une vraie génération, dans `.env.local` :

```
AI_PROVIDER=anthropic        # ou openai
AI_API_KEY=sk-...
AI_MODEL=claude-sonnet-5-5   # ou gpt-4o-mini, etc.
AI_BASE_URL=                 # optionnel (endpoint compatible OpenAI auto-hébergé)
```

Le prompt (dans `src/lib/ai/prompt.ts`) interdit explicitement d'inventer montant, date ou promesse ; le modèle doit répondre en JSON avec trois variantes. Chaque génération (réelle ou simulée) consomme 1 unité du quota mensuel.

## 4. Stripe (Billing + Tax)

Follow IA vend un abonnement SaaS mensuel : c'est **Stripe Billing** (Checkout + portail client + webhook). **Stripe Tax** gère la TVA sur vos abonnements, derrière un interrupteur. Stripe Invoicing n'est pas utilisé : les factures de l'abonnement sont générées automatiquement par Billing, et l'application ne facture jamais les clients finaux des artisans.

L'intégration est écrite mais **non testée en conditions réelles** dans ce dépôt. Tant que les variables ne sont pas renseignées, les boutons « Passer à Pro/Business » affichent « Bientôt disponible ». **Le plan payant n'est activé que par le webhook, après vérification de la signature Stripe**, jamais par le retour de Checkout.

### Mise en place (mode test)

1. Exécutez `supabase/migrations/0002_stripe.sql` dans l'éditeur SQL Supabase (colonne de statut + journal d'idempotence).
2. Créez les produits et prix de test :
   ```bash
   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
   ```
   Le script est idempotent et refuse une clé de production. Il affiche `STRIPE_PRICE_PRO` et `STRIPE_PRICE_BUSINESS` à copier dans `.env.local`.
3. Renseignez dans `.env.local` (jamais dans le dépôt) :
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...       # fourni par `stripe listen` (étape 4)
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_BUSINESS=price_...
   STRIPE_AUTOMATIC_TAX=false
   SUPABASE_SERVICE_ROLE_KEY=...         # Supabase → Settings → API, serveur uniquement
   ```
4. Webhook en local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
5. Dashboard Stripe → Paramètres → **Portail client** : enregistrez la configuration par défaut (sinon « Gérer mon abonnement » échoue).
6. Testez avec la carte `4242 4242 4242 4242` ; vérifiez que le plan change **après** l'arrivée de l'événement dans `stripe listen`, et que la ligne apparaît dans `stripe_events`.

### Stripe Tax

Activez d'abord Stripe Tax dans le dashboard (adresse d'origine, enregistrements TVA). Ensuite seulement, mettez `STRIPE_AUTOMATIC_TAX=true` : Checkout collecte alors l'adresse de facturation et le numéro de TVA (B2B) et calcule la TVA. Les prix créés par le script sont **TTC** (`tax_behavior: inclusive`), cohérents avec les tarifs affichés.

### Événements traités

`checkout.session.completed` (paiement confirmé → plan activé), `customer.subscription.created/updated/deleted` (changement d'offre, résiliation, impayé → retour en gratuit), `invoice.payment_failed` (statut `past_due`, plan conservé tant que Stripe réessaie). Chaque événement est journalisé dans `stripe_events` : un doublon est ignoré, une erreur renvoie 500 pour que Stripe réessaie.

### Passage en production

Clé `sk_live_`, prix créés depuis le dashboard (le script ne le fait pas volontairement), endpoint webhook `https://votre-domaine/api/stripe/webhook` avec son propre secret, et vérifiez les mentions légales/CGU (conditions de résiliation).

## 5. Commandes

| Commande            | Rôle                                        |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | serveur de développement                     |
| `npm run build`     | build de production                          |
| `npm start`         | lance le build                               |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript strict                            |
| `npm test`          | tests unitaires (Vitest)                     |
| `npm run check`     | lint + typecheck + tests + build, à la suite |

## 6. Arborescence

```
.
├── .env.example                 modèle de variables d'environnement (aucune vraie clé)
├── supabase/migrations/
│   └── 0001_init.sql            schéma, déclencheurs, quotas, RLS
├── src/
│   ├── proxy.ts                 rafraîchit la session Supabase, protège les pages privées
│   ├── app/
│   │   ├── (marketing)/         landing, mentions légales, confidentialité, CGU
│   │   ├── (auth)/              connexion, inscription, mot de passe oublié, réinitialisation
│   │   ├── (app)/               espace privé : dashboard, clients, devis, relances,
│   │   │                        assistant, paramètres, abonnement (+ actions serveur)
│   │   ├── api/ai/generate/     génération IA (quota vérifié côté serveur)
│   │   ├── api/export/          export JSON des données de l'utilisateur
│   │   ├── api/stripe/webhook/  activation d'un plan après paiement vérifié
│   │   ├── auth/callback/       liens email Supabase (confirmation, reset)
│   │   ├── demo/                démonstration avec données fictives
│   │   └── configuration-requise/
│   ├── components/
│   │   ├── ui/                  boutons, champs, cartes, dialogues, toasts, badges…
│   │   ├── app/                 sidebar, formulaires, listes, assistant IA
│   │   ├── auth/                formulaires d'authentification
│   │   └── marketing/           en-tête, pied de page, gabarit légal
│   └── lib/
│       ├── supabase/            clients serveur / navigateur / admin (webhook)
│       ├── validation/          schémas Zod + libellés
│       ├── ai/                  prompt, fournisseurs, simulation
│       ├── data/                requêtes (profil, tableau de bord)
│       ├── plans.ts             offres et quotas
│       ├── stripe.ts
│       ├── demo-data.ts         données fictives du mode démo
│       └── utils.ts             dates, formats
└── tests/                       Vitest : validation, quotas, IA, dates
```

## 7. Sécurité et données

- **RLS** sur toutes les tables : un utilisateur ne lit et ne modifie que ses lignes (`auth.uid() = user_id`).
- Le **plan** et les identifiants Stripe ne sont pas modifiables par l'utilisateur (privilèges de colonne) ; seul le webhook (clé `service_role`, côté serveur) peut les changer.
- **Quotas** : limite de clients appliquée par déclencheur en base ; quota IA consommé atomiquement par la fonction `consume_ai_generation()` (verrou sur le profil). Le code vérifie aussi avant d'appeler le fournisseur.
- **Validation** serveur de toutes les entrées (Zod), vérification de l'utilisateur dans chaque Server Action et route API.
- **Pas d'envoi automatique** d'email ou de SMS.
- **Données personnelles** : export JSON (`/api/export`) et suppression du compte (fonction `delete_own_account()`) depuis Paramètres. La politique de confidentialité contient des zones `[À compléter]` à renseigner avant mise en production.

## 8. Déploiement

Exemple avec Vercel (adaptable à tout hébergeur Node) :

1. Poussez le dépôt sur GitHub, importez-le dans Vercel.
2. Renseignez les variables d'environnement (celles de `.env.example`), avec `NEXT_PUBLIC_SITE_URL=https://votre-domaine`.
3. Dans Supabase, ajoutez `https://votre-domaine/auth/callback` aux *Redirect URLs* et mettez `Site URL` à jour.
4. Déployez. Le build (`next build`) refuse de passer si TypeScript échoue.
5. Pour Stripe : créez un endpoint webhook vers `https://votre-domaine/api/stripe/webhook` et copiez son secret dans `STRIPE_WEBHOOK_SECRET`.

## 9. État réel des fonctionnalités

### Vérifié dans ce dépôt
- Lint, TypeScript strict, 30 tests unitaires, `next build` : passent.
- Rendu testé (serveur de production + navigateur) : landing, démo, connexion, inscription, 404, redirections des pages privées quand Supabase n'est pas configuré, réponses d'erreur des API sans configuration.

### Écrit mais **non testé contre un vrai projet Supabase** (pas de Postgres dans l'environnement de développement)
- Exécution de `0001_init.sql`, inscription/connexion/reset, CRUD clients/devis/relances, historique, export, suppression de compte, quotas en base.
- Génération IA avec une vraie clé Anthropic/OpenAI.
- Stripe : Checkout, portail client, webhook, script `scripts/stripe-setup.mjs`.

Ces parcours sont écrits selon la documentation à jour des bibliothèques installées, mais doivent être joués une fois avant de considérer le produit prêt.

### Nécessite une configuration
- Supabase (obligatoire), clé IA (sinon simulation), Stripe + clé service_role (sinon offres payantes désactivées).

### Non fait volontairement
- Envoi automatique d'emails/SMS, génération de devis/factures conformes, témoignages ou chiffres clients fictifs sur la landing.

## 10. Tests à effectuer avant de proposer le produit à des clients

1. Exécuter la migration sur un projet Supabase neuf ; vérifier qu'aucune erreur n'apparaît.
2. Inscription → email de confirmation → connexion → déconnexion → mot de passe oublié → nouveau mot de passe.
3. Avec **deux comptes** : vérifier qu'un compte ne voit jamais les clients/devis/relances de l'autre (y compris en forgeant une URL `/clients/<id de l'autre>` → 404).
4. Créer 10 clients en offre gratuite, tenter le 11e : message de limite, aucune insertion.
5. Lancer 5 générations IA (simulation ou réelle), tenter la 6e : refus 429, compteur correct ; vérifier la remise à zéro le mois suivant (ou en modifiant `created_at` en base).
6. Avec une vraie clé IA : vérifier que les trois variantes n'inventent ni montant ni date quand le champ devis est vide.
7. Relances : créer, modifier, terminer (le dernier contact du client doit se mettre à jour), rouvrir, supprimer ; vérifier l'historique.
8. Export JSON : le fichier contient bien toutes les données et uniquement les siennes.
9. Suppression de compte : plus de connexion possible, aucune ligne restante en base.
10. Stripe en mode test : paiement → plan activé uniquement après réception du webhook ; annulation → retour en gratuit.
11. Mobile (téléphone réel) : navigation, formulaires, dialogues de suppression, clavier.
12. Accessibilité : parcours complet au clavier, lecteur d'écran sur les formulaires.
13. Compléter les pages légales (zones `[À compléter]`) et la politique de confidentialité ; vérifier la conformité RGPD de l'usage prévu.
14. Configurer les modèles d'email Supabase (voir section 2) et tester depuis un autre appareil que celui de l'inscription.
