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
  const baseUrl = process.env.AI_BASE_URL?.trim() || undefined;
  return { provider, apiKey, model, baseUrl };
}

export class AiProviderError extends Error {}

async function callAnthropic(cfg: AiConfig, req: AiRequest): Promise<string> {
  const res = await fetch(`${cfg.baseUrl ?? "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 1500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(req) }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new AiProviderError(`Anthropic a répondu ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
}

async function callOpenAI(cfg: AiConfig, req: AiRequest): Promise<string> {
  const res = await fetch(`${cfg.baseUrl ?? "https://api.openai.com"}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new AiProviderError(`OpenAI a répondu ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Appelle le fournisseur configuré et renvoie les trois variantes validées. */
export async function generateWithProvider(cfg: AiConfig, req: AiRequest): Promise<AiVariant[]> {
  const raw = cfg.provider === "anthropic" ? await callAnthropic(cfg, req) : await callOpenAI(cfg, req);
  const variants = parseVariants(raw);
  if (!variants) throw new AiProviderError("Réponse du modèle inexploitable");
  return variants;
}
