import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Les images arrivent en base64 dans le JSON : limite large mais bornée.
app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "public")));

const STYLES = {
  studio: {
    label: "Studio produit",
    prompt:
      "Transforme cette photo en photo publicitaire professionnelle de studio : fond épuré et élégant, éclairage de studio doux avec reflets maîtrisés, le sujet parfaitement mis en valeur, rendu haut de gamme digne d'une campagne de marque. Ne change pas le produit/sujet lui-même.",
  },
  lifestyle: {
    label: "Lifestyle",
    prompt:
      "Transforme cette photo en visuel publicitaire lifestyle : mets le sujet en scène dans un environnement réel chaleureux et aspirationnel (intérieur lumineux ou extérieur naturel), lumière dorée, ambiance authentique de campagne publicitaire. Ne change pas le produit/sujet lui-même.",
  },
  luxe: {
    label: "Luxe",
    prompt:
      "Transforme cette photo en visuel publicitaire luxe : fond sombre et texturé (marbre, velours ou laque noire), éclairage dramatique et précis, reflets dorés subtils, esthétique de publicité pour marque de luxe. Ne change pas le produit/sujet lui-même.",
  },
  street: {
    label: "Urbain / Street",
    prompt:
      "Transforme cette photo en visuel publicitaire urbain : décor de ville moderne, néons ou lumière crépusculaire, énergie street et contemporaine, composition dynamique digne d'une campagne d'affichage. Ne change pas le produit/sujet lui-même.",
  },
};

app.get("/api/styles", (_req, res) => {
  res.json(
    Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label }))
  );
});

app.post("/api/generate", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY manquante. Copiez .env.example vers .env et ajoutez votre clé (https://aistudio.google.com).",
    });
  }

  const { imageBase64, mimeType, style, instructions } = req.body || {};
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Image manquante." });
  }
  if (!/^image\/(png|jpeg|webp|heic|heif)$/.test(mimeType)) {
    return res.status(400).json({ error: "Format d'image non supporté." });
  }

  const styleDef = STYLES[style] || STYLES.studio;
  let prompt = styleDef.prompt;
  if (instructions && typeof instructions === "string") {
    prompt += ` Consignes supplémentaires du client : ${instructions.slice(0, 500)}`;
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erreur Gemini:", response.status, errText);
      return res.status(502).json({
        error: `L'API de génération a répondu ${response.status}. Vérifiez votre clé et votre quota.`,
      });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    if (!imagePart) {
      const textPart = parts.find((p) => p.text);
      return res.status(502).json({
        error:
          "Le modèle n'a pas renvoyé d'image." +
          (textPart ? ` Réponse : ${textPart.text.slice(0, 300)}` : ""),
      });
    }

    const inline = imagePart.inlineData || imagePart.inline_data;
    res.json({
      imageBase64: inline.data,
      mimeType: inline.mimeType || inline.mime_type || "image/png",
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur interne pendant la génération." });
  }
});

app.listen(PORT, () => {
  console.log(`✨ AB3D Photo Pub — http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn(
      "⚠️  GEMINI_API_KEY non définie : la génération échouera. Voir .env.example."
    );
  }
});
