import { test } from "node:test";
import assert from "node:assert/strict";

import { buildProviders, createGeminiProvider, createOpenAICompatProvider } from "../services/llm.js";

function fakeFetch(response) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  impl.calls = calls;
  return impl;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("buildProviders returns none without keys", () => {
  assert.deepEqual(buildProviders({}), []);
});

test("buildProviders returns gemini only when its key is set", () => {
  const ps = buildProviders({ GEMINI_API_KEY: "k" });
  assert.deepEqual(ps.map((p) => p.name), ["gemini"]);
});

test("buildProviders returns fallback-llm only when its key is set", () => {
  const ps = buildProviders({ FALLBACK_LLM_API_KEY: "k", FALLBACK_LLM_BASE_URL: "https://x.test/v1" });
  assert.deepEqual(ps.map((p) => p.name), ["fallback-llm"]);
});

test("buildProviders orders gemini before fallback-llm", () => {
  const ps = buildProviders({ GEMINI_API_KEY: "a", FALLBACK_LLM_API_KEY: "b" });
  assert.deepEqual(ps.map((p) => p.name), ["gemini", "fallback-llm"]);
});

test("gemini provider sends key in header, not URL, and parses text", async () => {
  const f = fakeFetch(jsonResponse({ candidates: [{ content: { parts: [{ text: "Halo " }, { text: "dunia" }] } }] }));
  const p = createGeminiProvider({ apiKey: "SECRET", model: "m-1" }, { fetchImpl: f });
  assert.equal(p.name, "gemini");
  assert.equal(await p.call("PROMPT"), "Halo dunia");

  const { url, init } = f.calls[0];
  assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/m-1:generateContent");
  assert.ok(!url.includes("SECRET"));
  assert.equal(init.method, "POST");
  assert.equal(init.headers["x-goog-api-key"], "SECRET");
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), { contents: [{ parts: [{ text: "PROMPT" }] }] });
  assert.ok(init.signal instanceof AbortSignal);
});

test("gemini provider throws on non-2xx without leaking the body", async () => {
  const f = fakeFetch(new Response("detail SECRET", { status: 429 }));
  const p = createGeminiProvider({ apiKey: "SECRET", model: "m" }, { fetchImpl: f });
  await assert.rejects(p.call("x"), (err) => !String(err.message).includes("SECRET"));
});

test("gemini provider throws on malformed JSON and on missing text", async () => {
  const bad = createGeminiProvider(
    { apiKey: "k", model: "m" },
    { fetchImpl: fakeFetch(new Response("{nope", { status: 200 })) }
  );
  await assert.rejects(bad.call("x"));
  const empty = createGeminiProvider(
    { apiKey: "k", model: "m" },
    { fetchImpl: fakeFetch(jsonResponse({ candidates: [] })) }
  );
  await assert.rejects(empty.call("x"));
});

test("openai-compatible provider uses bearer header, chat body and parses message", async () => {
  const f = fakeFetch(jsonResponse({ choices: [{ message: { content: "Jawaban" } }] }));
  const p = createOpenAICompatProvider(
    { baseUrl: "https://host.test/v1/", apiKey: "SECRET", model: "open-model" },
    { fetchImpl: f }
  );
  assert.equal(p.name, "fallback-llm");
  assert.equal(await p.call("PROMPT"), "Jawaban");

  const { url, init } = f.calls[0];
  assert.equal(url, "https://host.test/v1/chat/completions");
  assert.ok(!url.includes("SECRET"));
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, "Bearer SECRET");
  assert.deepEqual(JSON.parse(init.body), {
    model: "open-model",
    messages: [{ role: "user", content: "PROMPT" }]
  });
  assert.ok(init.signal instanceof AbortSignal);
});

test("openai-compatible provider throws on non-2xx, malformed JSON and empty choices", async () => {
  const mk = (res) =>
    createOpenAICompatProvider({ baseUrl: "https://h.test/v1", apiKey: "k", model: "m" }, { fetchImpl: fakeFetch(res) });
  await assert.rejects(mk(new Response("err", { status: 500 })).call("x"));
  await assert.rejects(mk(new Response("{nope", { status: 200 })).call("x"));
  await assert.rejects(mk(jsonResponse({ choices: [] })).call("x"));
});
