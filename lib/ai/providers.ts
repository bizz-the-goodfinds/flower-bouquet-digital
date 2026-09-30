/**
 * AI note writer, bring your own key. The browser calls the provider directly: the key never touches our server.
 * All four providers allow browser (CORS) requests. The catalog is plain data so the guide page can render it on the server.
 */

export type ProviderId = "gemini" | "openai" | "anthropic" | "openrouter";

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  /** Who makes it, for people who know the chat app rather than the company. */
  aka: string;
  defaultModel: string;
  keyPrefix: RegExp;
  keyPlaceholder: string;
  free: boolean;
  cost: string;
  signupUrl: string;
  keyUrl: string;
  limitUrl: string;
  steps: string[];
  limitTip: string;
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    aka: "Gemini",
    defaultModel: "gemini-flash-lite-latest",
    keyPrefix: /^AIza[0-9A-Za-z_-]{30,}$/,
    keyPlaceholder: "AIza…",
    free: true,
    cost: "Free tier (a daily limit of requests). Paid use is well under a tenth of a cent per note.",
    signupUrl: "https://aistudio.google.com/",
    keyUrl: "https://aistudio.google.com/app/apikey",
    limitUrl: "https://aistudio.google.com/usage",
    steps: [
      "Open Google AI Studio and sign in with your Google account.",
      "Go to “Get API key” and tap “Create API key”. Pick or create a project when asked.",
      "Copy the key (it starts with AIza) and paste it here.",
    ],
    limitTip: "The free tier can't charge you. If you add billing to the project, set a budget alert in Google Cloud Billing.",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    aka: "ChatGPT",
    defaultModel: "gpt-5.4-mini",
    keyPrefix: /^sk-[A-Za-z0-9_-]{20,}$/,
    keyPlaceholder: "sk-…",
    free: false,
    cost: "Pay as you go. About a tenth of a cent per set of drafts. A ChatGPT Plus plan does not include API credit.",
    signupUrl: "https://platform.openai.com/signup",
    keyUrl: "https://platform.openai.com/api-keys",
    limitUrl: "https://platform.openai.com/settings/organization/limits",
    steps: [
      "Sign in at platform.openai.com (the developer site, separate from the ChatGPT app).",
      "Add a few dollars of credit under Settings → Billing.",
      "Open API keys, tap “Create new secret key”, then copy it (it starts with sk-).",
    ],
    limitTip: "Under Settings → Limits, set a monthly budget. Prepaid credit also caps what you can spend.",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    aka: "Claude",
    defaultModel: "claude-haiku-4-5",
    keyPrefix: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    keyPlaceholder: "sk-ant-…",
    free: false,
    cost: "Pay as you go. About a fifth of a cent per set of drafts with Claude Haiku. A Claude Pro plan does not include API credit.",
    signupUrl: "https://console.anthropic.com/",
    keyUrl: "https://console.anthropic.com/settings/keys",
    limitUrl: "https://console.anthropic.com/settings/limits",
    steps: [
      "Sign in to the Claude Console at console.anthropic.com.",
      "Buy a little credit under Settings → Billing.",
      "Open Settings → API keys, tap “Create key”, then copy it (it starts with sk-ant-).",
    ],
    limitTip: "Under Settings → Limits, set a monthly spend limit for the workspace.",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    aka: "Any model",
    defaultModel: "google/gemini-3.5-flash-lite",
    keyPrefix: /^sk-or-[A-Za-z0-9_-]{20,}$/,
    keyPlaceholder: "sk-or-…",
    free: false,
    cost: "Pay as you go, one account for models from every major provider. Under a tenth of a cent per set of drafts with the default model.",
    signupUrl: "https://openrouter.ai/",
    keyUrl: "https://openrouter.ai/settings/keys",
    limitUrl: "https://openrouter.ai/settings/keys",
    steps: [
      "Tap “Sign in with OpenRouter” below. Log in or create an account.",
      "Approve access. You come straight back here with a key, nothing to copy.",
      "Add a little credit on openrouter.ai if your account has none.",
    ],
    limitTip: "When you approve, you can set a credit limit for the key. You can change it later under Settings → Keys.",
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["gemini", "openrouter", "openai", "anthropic"];

export const TONES = {
  cute: { name: "Cute", emoji: "🥰" },
  funny: { name: "Funny", emoji: "😂" },
  deep: { name: "Deep", emoji: "🌙" },
  romantic: { name: "Romantic", emoji: "💘" },
  sorry: { name: "Sorry", emoji: "🥺" },
  short: { name: "Short & sweet", emoji: "✨" },
} as const;
export type Tone = keyof typeof TONES;

export type Tweak = "shorter" | "emoji" | "again";

export type WriteRequest = { tone: Tone; to: string; from: string; occasion: string | null; details: string; tweak?: Tweak; previous?: string[] };

export type Connection = { provider: ProviderId; key: string; model: string };

export type AiErrorCode = "invalid_key" | "no_credit" | "rate_limited" | "provider_down" | "network" | "bad_output";

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const MAX_NOTE = 500;

function systemPrompt() {
  return [
    "You write short notes that go on the card of a digital flower bouquet.",
    "Write exactly 3 different drafts. Each is a complete note the sender could send as is: warm, specific, kind, in plain everyday language.",
    `Each draft is at most 280 characters (never more than ${MAX_NOTE}). No hashtags, no quotation marks around the note, no sign-off with the sender's name (the card adds it).`,
    "Match the requested tone and occasion. Use the details if given. Never be mean, sexual, or hurtful, even if asked.",
    'Reply with JSON only, in this shape: {"drafts": ["...", "...", "..."]}',
  ].join("\n");
}

function userPrompt(r: WriteRequest) {
  const lines = [
    `Tone: ${TONES[r.tone].name}`,
    r.occasion ? `Occasion: ${r.occasion}` : "Occasion: just because",
    r.to ? `To: ${r.to}` : "",
    r.from ? `From: ${r.from}` : "",
    r.details.trim() ? `Details from the sender: ${r.details.trim().slice(0, 300)}` : "",
  ];
  if (r.previous?.length) {
    lines.push(`Previous drafts:\n${r.previous.map((d) => `- ${d}`).join("\n")}`);
    if (r.tweak === "shorter") lines.push("Rewrite them noticeably shorter: one or two short sentences each.");
    if (r.tweak === "emoji") lines.push("Rewrite them with more emoji woven in (3 to 6 per draft).");
    if (r.tweak === "again") lines.push("Write 3 fresh drafts that are different from these.");
  }
  return lines.filter(Boolean).join("\n");
}

function errorFor(status: number, body: string): AiError {
  const text = body.toLowerCase();
  if (status === 401 || status === 403 || text.includes("api key not valid") || text.includes("invalid x-api-key") || text.includes("incorrect api key"))
    return new AiError("invalid_key", "That key didn't work. Check it was copied in full, or create a new one.");
  if (status === 402 || text.includes("insufficient_quota") || text.includes("credit balance") || text.includes("insufficient credits"))
    return new AiError("no_credit", "Your AI account is out of credit. Add a little on the provider's site, then try again.");
  if (status === 429) return new AiError("rate_limited", "The AI is busy or you've hit your limit for now. Wait a minute and try again.");
  if (status >= 500) return new AiError("provider_down", "The AI provider is having trouble right now. Try again in a bit.");
  return new AiError("provider_down", "Something went wrong with the AI request. Try again.");
}

async function call(url: string, init: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new AiError("network", "Couldn't reach the AI provider. Check your connection and try again.");
  }
  const body = await res.text();
  if (!res.ok) throw errorFor(res.status, body);
  try {
    return JSON.parse(body);
  } catch {
    throw new AiError("bad_output", "The AI sent back something unexpected. Try again.");
  }
}

/** Sends a prompt and returns the model's raw text. */
async function complete(c: Connection, system: string, user: string, maxTokens: number): Promise<string> {
  const model = c.model || PROVIDERS[c.provider].defaultModel;
  if (c.provider === "gemini") {
    const d = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": c.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens, temperature: 1 },
      }),
    });
    return (d.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  }
  if (c.provider === "anthropic") {
    const d = await call("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": c.key,
        "anthropic-version": "2023-06-01",
        // Required for calls straight from a browser. The key is the user's own and stays on their device.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    });
    return (d.content ?? []).map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("");
  }
  // OpenAI and OpenRouter share the Chat Completions format.
  const openrouter = c.provider === "openrouter";
  const d = await call(openrouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.key}`,
      ...(openrouter ? { "X-Title": "Flower Bouquet Digital", "HTTP-Referer": location.origin } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      ...(openrouter ? { max_tokens: maxTokens } : { max_completion_tokens: maxTokens * 3, reasoning_effort: "low" }),
    }),
  });
  return d.choices?.[0]?.message?.content ?? "";
}

/** Pulls the drafts out of the model's reply, tolerating code fences or a bare list. */
export function parseDrafts(text: string): string[] {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  let list: unknown = null;
  try {
    const j = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
    list = j.drafts;
  } catch {
    try {
      list = JSON.parse(cleaned.slice(cleaned.indexOf("["), cleaned.lastIndexOf("]") + 1));
    } catch {}
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.trim().replace(/^["“]|["”]$/g, "").slice(0, MAX_NOTE))
    .filter(Boolean)
    .slice(0, 3);
}

export async function writeDrafts(c: Connection, r: WriteRequest) {
  const drafts = parseDrafts(await complete(c, systemPrompt(), userPrompt(r), 800));
  if (!drafts.length) throw new AiError("bad_output", "The AI didn't come up with anything. Try again.");
  return drafts;
}

/** A tiny request that confirms the key and model work before saving them. */
export async function testConnection(c: Connection) {
  await complete(c, "Reply with JSON only.", 'Reply with {"ok": true}', 40);
}

// ---------- OpenRouter sign-in (OAuth PKCE) ----------

const VERIFIER_KEY = "pp-or-verifier";

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Sends the user to OpenRouter to approve a key. They come back to /ai/callback. */
export async function startOpenRouterSignIn() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const callback = `${location.origin}/ai/callback`;
  location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callback)}&code_challenge=${challenge}&code_challenge_method=S256`;
}

/** Trades the code OpenRouter sent back for a key. */
export async function finishOpenRouterSignIn(code: string) {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  if (!verifier) throw new AiError("invalid_key", "The sign-in expired. Start it again from the note writer.");
  const d = await call("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });
  if (typeof d.key !== "string") throw new AiError("invalid_key", "OpenRouter didn't send a key back. Try again.");
  return d.key as string;
}
