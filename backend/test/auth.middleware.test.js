import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// DB_PATH harus diset sebelum db.js di-import supaya db.json asli tidak tersentuh.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "studytrack-auth-"));
process.env.DB_PATH = path.join(tmpDir, "db.json");

const jwt = (await import("jsonwebtoken")).default;
const { createApp } = await import("../app.js");
const { resetDB, readDB, writeDB } = await import("../db.js");
const { JWT_SECRET } = await import("../config.js");

let server;
let base;

function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}

async function getTasks(token) {
  const res = await fetch(`${base}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, body: await res.json() };
}

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

async function loginDemo() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@studytrack.test", password: "demo1234" })
  });
  return (await res.json()).token;
}

before(async () => {
  resetDB();
  server = await listen(createApp());
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("a valid token for an existing user still works", async () => {
  resetDB();
  const { status, body } = await getTasks(await loginDemo());
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.tasks));
});

test("req.user comes from the stored user (GET /api/auth/me)", async () => {
  resetDB();
  const token = await loginDemo();
  const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).user, {
    id: 1,
    nama: "Demo Mahasiswa",
    email: "demo@studytrack.test"
  });
});

test("a token for a user id that does not exist gets 401", async () => {
  resetDB();
  const token = sign({ sub: 999, nama: "Hantu", email: "hantu@studytrack.test" });
  const { status, body } = await getTasks(token);
  assert.equal(status, 401);
  assert.equal(typeof body.error, "string");
});

test("a token whose email no longer matches the stored user gets 401", async () => {
  resetDB();
  const token = sign({ sub: 1, nama: "Demo Mahasiswa", email: "lama@studytrack.test" });
  const { status, body } = await getTasks(token);
  assert.equal(status, 401);
  assert.equal(typeof body.error, "string");
});

test("after resetDB an old token for a deleted user gets 401", async () => {
  resetDB();
  const db = readDB();
  db.users.push({ id: 2, nama: "Budi", email: "budi@studytrack.test", password_hash: "x" });
  db.nextIds.user = 3;
  writeDB(db);
  const token = sign({ sub: 2, nama: "Budi", email: "budi@studytrack.test" });
  assert.equal((await getTasks(token)).status, 200);

  resetDB(); // seperti restart Render: id pengguna kembali ke seed
  const { status } = await getTasks(token);
  assert.equal(status, 401);
});
