/**
 * Provider LLM untuk saran urutan belajar.
 *
 * Urutan: Gemini (REST generateContent), lalu provider kompatibel OpenAI
 * (mis. model open-source di OpenRouter atau Groq). Tiap provider hanya
 * dimasukkan bila kunci API-nya diisi. Setiap panggilan dibatasi 8 detik.
 * Pesan error tidak memuat isi respons maupun kunci API.
 */

const TIMEOUT_MS = 8000;

// Nama model gratis stabil menurut dokumentasi resmi Google AI (dicek 2026-11-15).
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_FALLBACK_BASE_URL = "https://openrouter.ai/api/v1";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function postJson(fetchImpl, url, headers, body) {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Provider LLM membalas HTTP ${res.status}`);
  return res.json();
}

/**
 * @param {{ apiKey: string, model?: string }} config
 * @param {{ fetchImpl?: typeof fetch }} [deps]
 */
export function createGeminiProvider({ apiKey, model = DEFAULT_GEMINI_MODEL }, { fetchImpl = fetch } = {}) {
  return {
    name: "gemini",
    async call(prompt) {
      const data = await postJson(
        fetchImpl,
        `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`,
        { "x-goog-api-key": apiKey },
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts) ? parts.map((p) => p?.text ?? "").join("") : "";
      if (!text) throw new Error("Respons Gemini tidak berisi teks");
      return text;
    }
  };
}

/**
 * @param {{ baseUrl?: string, apiKey: string, model?: string }} config
 * @param {{ fetchImpl?: typeof fetch }} [deps]
 */
export function createOpenAICompatProvider(
  { baseUrl = DEFAULT_FALLBACK_BASE_URL, apiKey, model },
  { fetchImpl = fetch } = {}
) {
  return {
    name: "fallback-llm",
    async call(prompt) {
      if (!model) throw new Error("FALLBACK_LLM_MODEL belum diisi");
      const data = await postJson(
        fetchImpl,
        `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
        { Authorization: `Bearer ${apiKey}` },
        { model, messages: [{ role: "user", content: prompt }] }
      );
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text) throw new Error("Respons LLM tidak berisi teks");
      return text;
    }
  };
}

/**
 * Menyusun daftar provider dari environment.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ name: string, call: (prompt: string) => Promise<string> }[]}
 */
export function buildProviders(env = process.env) {
  const providers = [];
  if (env.GEMINI_API_KEY) {
    providers.push(
      createGeminiProvider({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || undefined })
    );
  }
  if (env.FALLBACK_LLM_API_KEY) {
    providers.push(
      createOpenAICompatProvider({
        baseUrl: env.FALLBACK_LLM_BASE_URL || undefined,
        apiKey: env.FALLBACK_LLM_API_KEY,
        model: env.FALLBACK_LLM_MODEL || undefined
      })
    );
  }
  return providers;
}
