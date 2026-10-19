import { describe, it, expect } from "vitest";
import { describeHttpError, extractProviderMessage, providerName } from "@/lib/ai/provider";

describe("providerName", () => {
  it("reconnaît le fournisseur d'après AI_BASE_URL", () => {
    expect(providerName({ provider: "openai", baseUrl: "https://api.mistral.ai" })).toBe("Mistral");
    expect(providerName({ provider: "openai", baseUrl: "https://api.groq.com/openai" })).toBe("Groq");
    expect(providerName({ provider: "openai", baseUrl: "https://openrouter.ai/api" })).toBe("OpenRouter");
    expect(providerName({ provider: "openai" })).toBe("OpenAI");
    expect(providerName({ provider: "anthropic" })).toBe("Anthropic");
    expect(providerName({ provider: "openai", baseUrl: "https://llm.example.com" })).toBe("llm.example.com");
  });
});

describe("extractProviderMessage", () => {
  it("lit les formats OpenAI, Mistral et texte brut", () => {
    expect(extractProviderMessage('{"error":{"message":"You exceeded your current quota"}}')).toBe("You exceeded your current quota");
    expect(extractProviderMessage('{"message":"Requests rate limit exceeded"}')).toBe("Requests rate limit exceeded");
    expect(extractProviderMessage('{"error":"Rate limited"}')).toBe("Rate limited");
    expect(extractProviderMessage("<html>oops</html>")).toBeNull();
  });
  it("masque ce qui ressemble à une clé", () => {
    expect(extractProviderMessage('{"error":{"message":"Incorrect API key provided: sk-abc123456789xyz"}}')).toBe("Incorrect API key provided: [clé masquée]");
  });
});

describe("describeHttpError", () => {
  it("explique un 429 avec le détail du fournisseur", () => {
    const msg = describeHttpError("Mistral", 429, "mistral-small-latest", "Requests rate limit exceeded");
    expect(msg).toContain("Mistral refuse temporairement");
    expect(msg).toContain("Requests rate limit exceeded");
  });
  it("n'affiche jamais le détail sur une erreur de clé", () => {
    const msg = describeHttpError("OpenAI", 401, "gpt-4o-mini", "Incorrect API key provided: sk-...");
    expect(msg).toContain("Vérifiez AI_API_KEY");
    expect(msg).not.toContain("sk-");
  });
  it("indique le modèle introuvable", () => {
    expect(describeHttpError("Mistral", 404, "mistral-xxl", null)).toContain("« mistral-xxl »");
  });
});

import { afterEach, vi } from "vitest";
import { generateWithProvider, AiProviderError } from "@/lib/ai/provider";

const okBody = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          variants: [
            { style: "professionnel", subject: "A", body: "Bonjour, message pro." },
            { style: "amical", subject: "B", body: "Bonjour, message amical." },
            { style: "court", subject: "C", body: "Bonjour, court." },
          ],
        }),
      },
    },
  ],
};
const cfg = { provider: "openai" as const, apiKey: "test", model: "mistral-small-latest", baseUrl: "https://api.mistral.ai" };
const req = { clientName: "Camille", context: "", messageType: "relance_devis" as const, tone: "professionnel" as const, quoteInfo: "", senderName: "", companyName: "" };
const tooMany = () => new Response('{"message":"Requests rate limit exceeded"}', { status: 429, headers: { "retry-after": "1" } });

describe("generateWithProvider — limite de débit", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("réessaie une fois après un 429 puis réussit", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tooMany()).mockResolvedValueOnce(new Response(JSON.stringify(okBody), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const variants = await generateWithProvider(cfg, req);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(variants).toHaveLength(3);
  });

  it("abandonne après deux 429 avec un message clair qui nomme Mistral", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => tooMany()));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = await generateWithProvider(cfg, req).catch((e) => e);
    expect(err).toBeInstanceOf(AiProviderError);
    expect(err.message).toContain("Mistral refuse temporairement");
    expect(err.message).toContain("Requests rate limit exceeded");
    expect(err.message).not.toContain("OpenAI");
  });
});
