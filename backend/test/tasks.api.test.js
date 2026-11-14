import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// DB_PATH harus diset sebelum db.js di-import supaya db.json asli tidak tersentuh.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "studytrack-api-"));
process.env.DB_PATH = path.join(tmpDir, "db.json");

const { createApp } = await import("../app.js");
const { resetDB } = await import("../db.js");

const CLOCK = new Date("2026-07-02T09:00:00+07:00");
let server;
let base;

function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}

function baseOf(s) {
  return `http://127.0.0.1:${s.address().port}`;
}

async function api(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

async function loginDemo() {
  const res = await api("POST", "/api/auth/login", {
    body: { email: "demo@studytrack.test", password: "demo1234" }
  });
  return res.body.token;
}

before(async () => {
  resetDB();
  server = await listen(createApp({ now: () => CLOCK }));
  base = baseOf(server);
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("returns ranked tasks with kategori and server_time", async () => {
  const token = await loginDemo();
  const { status, body } = await api("GET", "/api/tasks", { token });
  assert.equal(status, 200);
  assert.deepEqual(body.tasks.map((t) => t.id), [2, 3, 1]);
  assert.deepEqual(body.tasks.map((t) => t.kategori), ["mendekati", "normal", "normal"]);
  assert.equal(body.server_time, CLOCK.toISOString());
});

test("requires login", async () => {
  const { status } = await api("GET", "/api/tasks");
  assert.equal(status, 401);
});

test("only returns the logged-in user's own tasks", async () => {
  const demoToken = await loginDemo();
  const demoBefore = (await api("GET", "/api/tasks", { token: demoToken })).body.tasks;

  const reg = await api("POST", "/api/auth/register", {
    body: { nama: "Tester Dua", email: "dua@studytrack.test", password: "rahasia123" }
  });
  assert.equal(reg.status, 201);
  const token = reg.body.token;

  const course = await api("POST", "/api/courses", { token, body: { name: "Kalkulus" } });
  assert.equal(course.status, 201);
  const created = await api("POST", "/api/tasks", {
    token,
    body: { mata_kuliah_id: course.body.course.id, judul: "Soal limit", deadline: "2026-07-02T09:30" }
  });
  assert.equal(created.status, 201);

  const mine = (await api("GET", "/api/tasks", { token })).body.tasks;
  assert.equal(mine.length, 1);
  assert.equal(mine[0].id, created.body.task.id);
  assert.equal(mine[0].kategori, "mendekati");

  const demoAfter = (await api("GET", "/api/tasks", { token: demoToken })).body.tasks;
  assert.deepEqual(demoAfter, demoBefore);
});

test("dev reset stays off in production", async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let prodServer;
  try {
    prodServer = await listen(createApp({ now: () => CLOCK }));
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }
  try {
    const res = await fetch(`${baseOf(prodServer)}/api/dev/reset`, { method: "POST" });
    assert.equal(res.status, 404);
  } finally {
    prodServer.close();
  }
});

test("POST rejects an invalid deadline with 400 and saves nothing", async () => {
  resetDB();
  const token = await loginDemo();
  const before = (await api("GET", "/api/tasks", { token })).body.tasks.length;

  for (const deadline of ["20266-07-05T10:00", "bukan-tanggal", "2026-13-45T10:00"]) {
    const res = await api("POST", "/api/tasks", {
      token,
      body: { mata_kuliah_id: 1, judul: "Tugas ngawur", deadline }
    });
    assert.equal(res.status, 400, deadline);
    assert.equal(typeof res.body.error, "string");
  }
  const after = (await api("GET", "/api/tasks", { token })).body.tasks.length;
  assert.equal(after, before);
});

test("POST accepts deadlines with and without seconds", async () => {
  resetDB();
  const token = await loginDemo();
  for (const deadline of ["2026-07-05T10:00", "2026-07-05T10:00:30"]) {
    const res = await api("POST", "/api/tasks", {
      token,
      body: { mata_kuliah_id: 1, judul: "Tugas valid", deadline }
    });
    assert.equal(res.status, 201, deadline);
    assert.equal(res.body.task.deadline, deadline);
  }
});

test("PUT rejects an invalid deadline with 400 and leaves the stored task unchanged", async () => {
  resetDB();
  const token = await loginDemo();
  const original = (await api("GET", "/api/tasks/1", { token })).body.task;

  const res = await api("PUT", "/api/tasks/1", {
    token,
    body: { judul: "Judul baru", deadline: "20266-07-05T10:00" }
  });
  assert.equal(res.status, 400);
  assert.equal(typeof res.body.error, "string");

  const stored = (await api("GET", "/api/tasks/1", { token })).body.task;
  assert.deepEqual(stored, original);
});

test("PUT accepts valid deadlines and ignores a missing deadline", async () => {
  resetDB();
  const token = await loginDemo();
  for (const deadline of ["2026-07-08T09:15", "2026-07-08T09:15:45"]) {
    const res = await api("PUT", "/api/tasks/1", { token, body: { deadline } });
    assert.equal(res.status, 200, deadline);
    assert.equal(res.body.task.deadline, deadline);
  }
  const noDeadline = await api("PUT", "/api/tasks/1", { token, body: { status: "selesai" } });
  assert.equal(noDeadline.status, 200);
  assert.equal(noDeadline.body.task.deadline, "2026-07-08T09:15:45");
});
