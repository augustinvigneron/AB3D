import "server-only";
import type { AiRequest } from "@/lib/validation/schemas";
import { SYSTEM_PROMPT, buildUserPrompt, parseVariants, type AiVariant } from "./prompt";

export type AiConfig = { provider: "anthropic" | "openai"; apiKey: string; model: string; baseUrl?: string };

/** Lit la configuration IA côté serveur. Renvoie null si aucune clé n'est définie. */
export function getAiConfig(): AiConfig | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  const provider = (process.env.AI_PROVIDER ?? "anthropic").trim().toLowerCase();
  if (provider !== "anthropic" && provider !== "openai") return null;
  const model = process.env.AI_MODEL?.trim() || (provider === "anthropic" ? "claude-sonnet-5-5" : "gpt-4o-mini");
  const baseUrl = process.env.AI_BASE_URL?.trim().replace(/\/+$/, "") || undefined;
  return { provider, apiKey, model, baseUrl };
}

export class AiProviderError extends Error {}

const KNOWN_HOSTS: Record<string, string> = {
  "api.openai.com": "OpenAI",
  "api.anthropic.com": "Anthropic",
  "api.mistral.ai": "Mistral",
  "api.groq.com": "Groq",
  "openrouter.ai": "OpenRouter",
  "integrate.api.nvidia.com": "NVIDIA",
};

/** Fournisseurs dont on sait qu'ils acceptent response_format json_object. Les autres reçoivent la consigne JSON par le prompt seul. */
const JSON_MODE_HOSTS = new Set(["api.openai.com", "api.mistral.ai", "api.groq.com"]);

export function supportsJsonMode(cfg: Pick<AiConfig, "baseUrl">): boolean {
  try {
    return JSON_MODE_HOSTS.has(new URL(cfg.baseUrl ?? "https://api.openai.com").hostname);
  } catch {
    return false;
  }
}

/** Nom lisible du fournisseur réellement appelé (d'après AI_BASE_URL), pour les messages d'erreur. */
export function providerName(cfg: Pick<AiConfig, "provider" | "baseUrl">): string {
  const fallback = cfg.provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com";
  try {
    const host = new URL(cfg.baseUrl ?? fallback).hostname;
    return KNOWN_HOSTS[host] ?? host;
  } catch {
    return "Le service d'IA";
  }
}

/** Retire tout ce qui ressemble à une clé d'API d'un message renvoyé par le fournisseur. */
function maskSecrets(text: string): string {
  return text.replace(/\b(?:sk|gsk|pk|rk|key|nvapi)[-_][A-Za-z0-9*_\-.]{6,}/gi, "[clé masquée]");
}

/** Extrait le message d'erreur d'une réponse JSON de fournisseur (formats OpenAI, Anthropic, Mistral…). */
export function extractProviderMessage(body: string): string | null {
  try {
    const data = JSON.parse(body) as Record<string, unknown>;
    const err = data.error;
    const candidates = [
      typeof err === "object" && err !== null ? (err as { message?: unknown }).message : undefined,
      typeof err === "string" ? err : undefined,
      data.message,
      data.detail,
    ];
    const found = candidates.find((c): c is string => typeof c === "string" && c.trim() !== "");
    return found ? maskSecrets(found.trim()).slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** Traduit une erreur HTTP du fournisseur en message compréhensible (en français). */
export function describeHttpError(name: string, status: number, model: string, providerMessage: string | null): string {
  const detail = providerMessage ? ` Détail : « ${providerMessage} »` : "";
  if (status === 401 || status === 403) {
    // Pas de détail ici : certains fournisseurs y recopient une partie de la clé.
    return `${name} refuse la clé d'API (clé invalide, désactivée, ou sans accès à ce modèle). Vérifiez AI_API_KEY.`;
  }
  if (status === 404) return `${name} ne trouve pas le modèle « ${model} ». Vérifiez AI_MODEL et AI_BASE_URL.${detail}`;
  if (status === 429) {
    return `${name} refuse temporairement la demande : limite de l'offre gratuite, crédit épuisé, ou trop de demandes à la suite.${detail}`;
  }
  if (status >= 500) return `${name} est momentanément indisponible (erreur ${status}). Réessayez dans quelques minutes.`;
  return `${name} a refusé la demande (erreur ${status}).${detail}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST JSON vers le fournisseur. Sur 429, réessaie une fois après le délai
 * indiqué (Retry-After, plafonné à 5 s) : les offres gratuites limitent souvent
 * à une requête par seconde.
 */
async function postJson(cfg: AiConfig, url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const name = providerName(cfg);
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new AiProviderError(`${name} ne répond pas (délai dépassé ou connexion impossible). Réessayez dans un instant.`);
    }

    if (res.ok) return res.json();

    const text = await res.text().catch(() => "");
    const providerMessage = extractProviderMessage(text);
    if (res.status === 429 && attempt === 0) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 2000);
      continue;
    }
    // Visible dans les journaux Vercel (Deployments → Logs) pour le diagnostic.
    console.error(`[IA] ${name} HTTP ${res.status} (modèle ${cfg.model}) : ${providerMessage ?? "sans détail"}`);
    throw new AiProviderError(describeHttpError(name, res.status, cfg.model, providerMessage));
  }
  throw new AiProviderError(describeHttpError(name, 429, cfg.model, null));
}

async function callAnthropic(cfg: AiConfig, req: AiRequest): Promise<string> {
  const data = (await postJson(
    cfg,
    `${cfg.baseUrl ?? "https://api.anthropic.com"}/v1/messages`,
    { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
    {
      model: cfg.model,
      max_tokens: 1500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(req) }],
    },
  )) as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
}

async function callOpenAICompatible(cfg: AiConfig, req: AiRequest): Promise<string> {
  const data = (await postJson(
    cfg,
    `${cfg.baseUrl ?? "https://api.openai.com"}/v1/chat/completions`,
    { authorization: `Bearer ${cfg.apiKey}` },
    {
      model: cfg.model,
      temperature: 0.7,
      ...(supportsJsonMode(cfg) ? { response_format: { type: "json_object" } } : {}),
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
    },
  )) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Appelle le fournisseur configuré et renvoie les trois variantes validées. */
export async function generateWithProvider(cfg: AiConfig, req: AiRequest): Promise<AiVariant[]> {
  const raw = cfg.provider === "anthropic" ? await callAnthropic(cfg, req) : await callOpenAICompatible(cfg, req);
  const variants = parseVariants(raw);
  if (!variants) throw new AiProviderError(`${providerName(cfg)} a répondu, mais dans un format inattendu. Réessayez.`);
  return variants;
}
