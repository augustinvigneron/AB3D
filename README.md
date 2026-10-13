# AB3D Photo Pub

Déposez une photo (produit, objet, plat…), choisissez un style, et l'IA génère une photo publicitaire.

## Fonctionnement

1. Le navigateur envoie la photo au serveur Node (`server.js`).
2. Le serveur ajoute un prompt selon le style choisi (Studio, Lifestyle, Luxe, Urbain) et les consignes éventuelles.
3. Il appelle l'API Google Gemini (modèle d'édition d'image `gemini-2.5-flash-image`), qui renvoie l'image transformée.
4. L'image s'affiche et peut être téléchargée.

La clé API reste côté serveur : elle n'est jamais exposée au navigateur.

## Lancer en local

Prérequis : Node.js 18 ou plus.

```bash
npm install
cp .env.example .env
# Ouvrez .env et collez votre clé : https://aistudio.google.com/apikey
npm start
```

Puis ouvrez http://localhost:3000.

## Personnaliser

- **Styles** : modifiez l'objet `STYLES` dans `server.js` (libellé et prompt).
- **Modèle** : changez `GEMINI_MODEL` dans `.env`.

## Limites à connaître

- Le modèle peut altérer le produit (logo, texte, forme). Pour un usage commercial, vérifiez chaque image.
- Chaque génération est payante au-delà du quota gratuit de Google.
- Aucune authentification ni limite de requêtes : à ajouter avant toute mise en ligne publique.
