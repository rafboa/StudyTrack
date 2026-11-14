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

test("throwing provider falls through to next", async () => {
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

test("all providers fail gives rule advice that lists the nearest task first", async () => {
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
