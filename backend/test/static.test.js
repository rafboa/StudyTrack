import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// DB_PATH harus diset sebelum db.js di-import supaya db.json asli tidak tersentuh.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "studytrack-static-"));
process.env.DB_PATH = path.join(tmpDir, "db.json");

const { createApp } = await import("../app.js");

const INDEX_HTML = "<!doctype html><title>StudyTrack Test</title><div id=\"root\"></div>";
const distDir = path.join(tmpDir, "dist");
const missingDist = path.join(tmpDir, "tidak-ada");

const servers = [];

function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => {
      servers.push(s);
      resolve(`http://127.0.0.1:${s.address().port}`);
    });
  });
}

let withDist;
let withoutDist;

before(async () => {
  fs.mkdirSync(path.join(distDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(distDir, "index.html"), INDEX_HTML);
  fs.writeFileSync(path.join(distDir, "assets", "app.js"), "console.log('ok');");
  withDist = await listen(createApp({ distDir }));
  withoutDist = await listen(createApp({ distDir: missingDist }));
});

after(() => {
  for (const s of servers) s.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("serves index.html at /", async () => {
  const res = await fetch(`${withDist}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.equal(await res.text(), INDEX_HTML);
});

test("serves index.html for client-side routes like /tasks", async () => {
  const res = await fetch(`${withDist}/tasks`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.equal(await res.text(), INDEX_HTML);
});

test("serves static assets from the dist folder", async () => {
  const res = await fetch(`${withDist}/assets/app.js`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "console.log('ok');");
});

test("keeps /api/health as JSON when dist exists", async () => {
  const res = await fetch(`${withDist}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("unknown /api path still returns the 404 JSON when dist exists", async () => {
  const res = await fetch(`${withDist}/api/nope`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await res.json(), { error: "Endpoint tidak ditemukan." });
});

test("non-GET requests to non-api paths are not answered with index.html", async () => {
  const res = await fetch(`${withDist}/tasks`, { method: "POST" });
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "Endpoint tidak ditemukan." });
});

test("without a dist folder GET / returns the old JSON 404", async () => {
  const res = await fetch(`${withoutDist}/`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "Endpoint tidak ditemukan." });
});
