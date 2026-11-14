import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSisa } from "./formatSisa.js";

test("mendekati: sisa waktu positif", () => {
  assert.equal(formatSisa(60, "mendekati"), "Sisa 1 j 0 m");
  assert.equal(formatSisa(59, "mendekati"), "Sisa 59 m");
  assert.equal(formatSisa(0, "mendekati"), "Sisa kurang dari 1 m");
  assert.equal(formatSisa(1439, "mendekati"), "Sisa 23 j 59 m");
});

test("overdue: keterlambatan", () => {
  assert.equal(formatSisa(-1, "overdue"), "Terlambat 1 m");
  assert.equal(formatSisa(-90, "overdue"), "Terlambat 1 j 30 m");
  assert.equal(formatSisa(0, "overdue"), "Terlambat kurang dari 1 m");
  assert.equal(formatSisa(-3000, "overdue"), "Terlambat 2 hr 2 j");
});

test("-0 diperlakukan sebagai 0", () => {
  assert.equal(formatSisa(-0, "mendekati"), "Sisa kurang dari 1 m");
  assert.equal(formatSisa(-0, "overdue"), "Terlambat kurang dari 1 m");
});

test("normal atau null menghasilkan string kosong", () => {
  assert.equal(formatSisa(500, "normal"), "");
  assert.equal(formatSisa(null, "normal"), "");
  assert.equal(formatSisa(null, "mendekati"), "");
  assert.equal(formatSisa(null, "overdue"), "");
});
