import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// DB_PATH harus diset sebelum db.js di-import supaya db.json asli tidak tersentuh.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "studytrack-ai-"));
process.env.DB_PATH = path.join(tmpDir, "db.json");

const { createApp } = await import("../app.js");
const { resetDB } = await import("../db.js");

const START = new Date("2026-07-02T09:00:00+07:00");
let clock = START;
const servers = [];

function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}

async function start(opts) {
  const s = await listen(createApp({ now: () => clock, ...opts }));
  servers.push(s);
  return `http://127.0.0.1:${s.address().port}`;
}

async function login(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@studytrack.test", password: "demo1234" })
  });
  return (await res.json()).token;
}

async function advise(base, token) {
  const res = await fetch(`${base}/api/ai/prioritas`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const text = await res.text();
  return { status: res.status, text, body: JSON.parse(text) };
}

before(() => {
  resetDB();
});

after(() => {
  for (const s of servers) s.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("POST /api/ai/prioritas returns advice from the injected provider", async () => {
  clock = START;
  const fake = { name: "fake", call: async () => "Kerjakan tugas 2 dulu." };
  const base = await start({ providers: [fake] });
  const { status, body } = await advise(base, await login(base));
  assert.equal(status, 200);
  assert.deepEqual(body, { saran: "Kerjakan tugas 2 dulu.", sumber: "fake", jumlah_tugas: 1 });
});

test("rate limit: second call within 10s is 429, after 11s is 200", async () => {
  clock = START;
  const fake = { name: "fake", call: async () => "ok" };
  const base = await start({ providers: [fake] });
  const token = await login(base);

  assert.equal((await advise(base, token)).status, 200);
  const second = await advise(base, token);
  assert.equal(second.status, 429);
  assert.equal(typeof second.body.error, "string");

  clock = new Date(START.getTime() + 11_000);
  assert.equal((await advise(base, token)).status, 200);
  clock = START;
});

test("no provider configured falls back to rule advice", async () => {
  clock = START;
  const base = await start({ providers: [] });
  const { status, body } = await advise(base, await login(base));
  assert.equal(status, 200);
  assert.equal(body.sumber, "rule");
  assert.equal(body.jumlah_tugas, 1);
});

test("a failing provider never leaks its error to the client", async () => {
  clock = START;
  const bad = {
    name: "gemini",
    call: async () => {
      throw new Error("KEY-LEAK-123");
    }
  };
  const base = await start({ providers: [bad] });
  const { status, text, body } = await advise(base, await login(base));
  assert.equal(status, 200);
  assert.ok(!text.includes("KEY-LEAK-123"));
  assert.equal(body.sumber, "rule");
});

test("requires login", async () => {
  const base = await start({ providers: [] });
  const { status } = await advise(base);
  assert.equal(status, 401);
});
