import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const configUrl = pathToFileURL(path.resolve(import.meta.dirname, "..", "config.js")).href;

const NO_ENV_FILE = path.join(import.meta.dirname, "tidak-ada", ".env");

// Config dimuat di proses terpisah dengan environment yang dikontrol penuh,
// supaya tidak ada env yang bocor ke test lain.
function loadConfig(env) {
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_ENV;
  delete cleanEnv.JWT_SECRET;
  // Arahkan dotenv ke berkas yang tidak ada supaya `backend/.env` milik developer
  // tidak ikut terbaca dan memengaruhi hasil test.
  cleanEnv.DOTENV_CONFIG_PATH = NO_ENV_FILE;
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import(${JSON.stringify(configUrl)}).then((m) => console.log(m.JWT_SECRET))`
    ],
    { env: { ...cleanEnv, ...env }, encoding: "utf8", cwd: path.resolve(import.meta.dirname, "..") }
  );
}

test("production without JWT_SECRET fails at startup with a clear error", () => {
  const res = loadConfig({ NODE_ENV: "production" });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /JWT_SECRET/);
});

test("production with an empty JWT_SECRET fails at startup", () => {
  const res = loadConfig({ NODE_ENV: "production", JWT_SECRET: "" });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /JWT_SECRET/);
});

test("production with a whitespace-only JWT_SECRET fails at startup", () => {
  const res = loadConfig({ NODE_ENV: "production", JWT_SECRET: "   " });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /JWT_SECRET wajib diisi/);
});

test("production with JWT_SECRET set uses it", () => {
  const res = loadConfig({ NODE_ENV: "production", JWT_SECRET: "throwaway-test-value" });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim(), "throwaway-test-value");
});

test("development without JWT_SECRET keeps the local default", () => {
  const res = loadConfig({ NODE_ENV: "development" });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.trim().length > 0);
});
