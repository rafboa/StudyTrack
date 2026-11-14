import { test } from "node:test";
import assert from "node:assert/strict";

import {
  selectAdviceTasks,
  buildPrompt,
  ruleBasedAdvice,
  getAdvice
} from "../services/advice.js";

function task(over = {}) {
  return {
    id: 1,
    judul: "Tugas",
    deskripsi: "",
    mata_kuliah: "Basis Data",
    status: "belum",
    kategori: "mendekati",
    sisa_menit: 60,
    ...over
  };
}

function provider(name, impl) {
  const p = {
    name,
    calls: 0,
    call: async (prompt) => {
      p.calls += 1;
      return impl(prompt);
    }
  };
  return p;
}

test("selectAdviceTasks drops selesai and normal", () => {
  const ranked = [
    task({ id: 1, kategori: "mendekati" }),
    task({ id: 2, kategori: "mendekati", status: "selesai" }),
    task({ id: 3, kategori: "normal" }),
    task({ id: 4, kategori: "overdue", sisa_menit: -30 }),
    task({ id: 5, kategori: "overdue", status: "selesai" })
  ];
  assert.deepEqual(selectAdviceTasks(ranked).map((t) => t.id), [1, 4]);
});

test("getAdvice with no tasks makes no provider call", async () => {
  const p = provider("fake", () => "saran");
  const result = await getAdvice([], [p]);
  assert.equal(result.sumber, "none");
  assert.ok(result.saran.length > 0);
  assert.equal(p.calls, 0);
});

test("first provider wins and sumber is its name", async () => {
  const a = provider("gemini", () => "  Kerjakan A dulu.  ");
  const b = provider("fallback-llm", () => "B");
  const result = await getAdvice([task()], [a, b]);
  assert.deepEqual(result, { saran: "Kerjakan A dulu.", sumber: "gemini" });
  assert.equal(b.calls, 0);
});

test("throwing provider falls through to next", async (t) => {
  t.mock.method(console, "warn", () => {});
  const a = provider("gemini", () => {
    throw new Error("boom");
  });
  const b = provider("fallback-llm", () => "dari B");
  const result = await getAdvice([task()], [a, b]);
  assert.equal(result.sumber, "fallback-llm");
  assert.equal(result.saran, "dari B");
  assert.equal(a.calls, 1);
});

test("blank output counts as failure", async () => {
  const a = provider("gemini", () => "   \n  ");
  const b = provider("fallback-llm", () => "dari B");
  const result = await getAdvice([task()], [a, b]);
  assert.equal(result.sumber, "fallback-llm");
});

test("all providers fail gives rule advice that lists the nearest task first", async (t) => {
  t.mock.method(console, "warn", () => {});
  const a = provider("gemini", () => {
    throw new Error("x");
  });
  const b = provider("fallback-llm", () => "");
  const tasks = [
    task({ id: 1, judul: "Laporan Praktikum", sisa_menit: 30 }),
    task({ id: 2, judul: "Esai Etika", sisa_menit: 600 })
  ];
  const result = await getAdvice(tasks, [a, b]);
  assert.equal(result.sumber, "rule");
  const first = result.saran.indexOf("Laporan Praktikum");
  const second = result.saran.indexOf("Esai Etika");
  assert.ok(first >= 0 && second > first);
  assert.equal(result.saran, ruleBasedAdvice(tasks));
});

test("prompt is capped at 10 tasks and 200 chars per field", () => {
  const long = "x".repeat(500);
  const tasks = Array.from({ length: 12 }, (_, i) =>
    task({ id: i + 1, judul: `J${i + 1}-${long}`, deskripsi: `D${i + 1}-${long}` })
  );
  const prompt = buildPrompt(tasks);
  assert.ok(prompt.includes("J10-"));
  assert.ok(!prompt.includes("J11-"));
  assert.ok(!prompt.includes("x".repeat(201)));
  assert.match(prompt, /Indonesia/);
});

test("prompt sends only task fields, no profile data", () => {
  const prompt = buildPrompt([task({ user_id: 1, nama: "Rahasia", email: "a@b.c" })]);
  assert.ok(!prompt.includes("Rahasia"));
  assert.ok(!prompt.includes("a@b.c"));
});

test("long output is capped at 1500 chars", async () => {
  const a = provider("gemini", () => "a".repeat(5000));
  const result = await getAdvice([task()], [a]);
  assert.equal(result.saran.length, 1500);
});

test("rule advice is capped at 1500 chars", async () => {
  const tasks = Array.from({ length: 10 }, (_, i) =>
    task({ id: i + 1, judul: "T".repeat(200), mata_kuliah: "M".repeat(200), sisa_menit: i + 1 })
  );
  const result = await getAdvice(tasks, []);
  assert.equal(result.sumber, "rule");
  assert.ok(result.saran.length <= 1500);
  assert.ok(ruleBasedAdvice(tasks).length <= 1500);
});

function loggedText(mock) {
  return mock.mock.calls.map((c) => c.arguments.map(String).join(" ")).join("\n");
}

test("a failing provider is logged with its name and error message only", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const bad = provider("gemini", () => {
    throw new Error("Provider LLM membalas HTTP 404");
  });
  const good = provider("fallback-llm", () => "ok");
  const result = await getAdvice([task()], [bad, good]);

  assert.equal(result.sumber, "fallback-llm");
  assert.equal(warn.mock.callCount(), 1);
  const text = loggedText(warn);
  assert.ok(text.includes("gemini"));
  assert.ok(text.includes("Provider LLM membalas HTTP 404"));
});

test("provider failure logs never contain the configured API key or the prompt", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const saved = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    FALLBACK_LLM_API_KEY: process.env.FALLBACK_LLM_API_KEY
  };
  process.env.GEMINI_API_KEY = "KEY-SECRET-GEMINI-777";
  process.env.FALLBACK_LLM_API_KEY = "KEY-SECRET-FALLBACK-888";
  t.after(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  // Satu provider melempar pesan tulisan sendiri, satu lagi pesan yang kebetulan memuat kunci.
  const plain = provider("gemini", () => {
    throw new Error("Provider LLM membalas HTTP 500");
  });
  const leaky = provider("fallback-llm", () => {
    throw new Error("gagal memanggil https://x.test/v1?key=KEY-SECRET-FALLBACK-888");
  });
  await getAdvice([task({ judul: "JUDUL-RAHASIA" })], [plain, leaky]);

  const text = loggedText(warn);
  assert.ok(text.includes("Provider LLM membalas HTTP 500"));
  assert.ok(!text.includes("KEY-SECRET-GEMINI-777"));
  assert.ok(!text.includes("KEY-SECRET-FALLBACK-888"));
  assert.ok(!text.includes("JUDUL-RAHASIA"));
});

test("a non-Error throw or a SyntaxError is logged as a fixed string, never its content", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const weird = provider("gemini", () => {
    throw "KEY-SECRET-STRING-999"; // bukan instance Error
  });
  const badJson = provider("fallback-llm", () => {
    JSON.parse('{"isi-respons-RESP-BODY-555');
  });
  await getAdvice([task()], [weird, badJson]);

  assert.equal(warn.mock.callCount(), 2);
  const text = loggedText(warn);
  assert.ok(text.includes("gemini"));
  assert.ok(text.includes("fallback-llm"));
  assert.ok(!text.includes("KEY-SECRET-STRING-999"));
  assert.ok(!text.includes("RESP-BODY-555"));
});
