import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { NEAR_MS, parseWIB, categorizeTask, buildTaskList } from "../lib/deadline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_URL = pathToFileURL(path.join(__dirname, "../lib/deadline.js")).href;

// Fixtures copied from the seed data in backend/db.js.
const courses = [
  { id: 1, user_id: 1, name: "Database Systems", kode: "CS 186", dosen: "Dr. Andi Wijaya" },
  { id: 2, user_id: 1, name: "Data Structures", kode: "CS 61B", dosen: "Dr. Sari Lestari" },
  { id: 3, user_id: 1, name: "Software Engineering", kode: "CS 169", dosen: "Dr. Budi Santoso" }
];

const tasks = [
  {
    id: 1,
    user_id: 1,
    mata_kuliah_id: 1,
    judul: "Lab 4: Query Optimization Report",
    deskripsi: "Laporan hasil eksperimen optimasi query beserta analisis query plan.",
    deadline: "2026-07-03T23:59:00",
    status: "belum",
    created_at: "2026-06-15T09:00:00"
  },
  {
    id: 2,
    user_id: 1,
    mata_kuliah_id: 2,
    judul: "Project 3: BSTMap Implementation",
    deskripsi: "Implementasi BSTMap beserta pengujian dasarnya.",
    deadline: "2026-07-02T10:00:00",
    status: "belum",
    created_at: "2026-06-16T14:00:00"
  },
  {
    id: 3,
    user_id: 1,
    mata_kuliah_id: 3,
    judul: "Sprint 2: Backend API Integration",
    deskripsi: "Integrasi endpoint backend ke frontend untuk sprint 2.",
    deadline: "2026-07-06T23:59:00",
    status: "belum",
    created_at: "2026-06-17T11:00:00"
  }
];

const [task1, task2, task3] = tasks;
const ids = (list) => list.map((t) => t.id);

test("NEAR_MS is 24 hours in milliseconds", () => {
  assert.equal(NEAR_MS, 86400000);
});

test("seed at 2026-07-02T09:00+07:00", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  assert.deepEqual(categorizeTask(task2, now), { kategori: "mendekati", sisa_menit: 60 });
  assert.deepEqual(categorizeTask(task1, now), { kategori: "normal", sisa_menit: 2339 });
  assert.equal(categorizeTask(task3, now).kategori, "normal");
  assert.deepEqual(ids(buildTaskList(tasks, courses, now)), [2, 3, 1]);
});

test("seed at 2026-07-04T00:00+07:00", () => {
  const now = new Date("2026-07-04T00:00:00+07:00");
  assert.deepEqual(categorizeTask(task1, now), { kategori: "overdue", sisa_menit: -1 });
  assert.deepEqual(categorizeTask(task2, now), { kategori: "overdue", sisa_menit: -2280 });
  assert.equal(categorizeTask(task3, now).kategori, "normal");
  assert.deepEqual(ids(buildTaskList(tasks, courses, now)), [1, 2, 3]);
});

test("exactly 24h is normal", () => {
  const now = new Date("2026-07-01T10:00:00+07:00");
  assert.deepEqual(categorizeTask(task2, now), { kategori: "normal", sisa_menit: 1440 });
  const oneMinuteLater = new Date("2026-07-01T10:01:00+07:00");
  assert.deepEqual(categorizeTask(task2, oneMinuteLater), { kategori: "mendekati", sisa_menit: 1439 });
});

test("exactly 0 is overdue", () => {
  const now = new Date("2026-07-02T10:00:00+07:00");
  assert.deepEqual(categorizeTask(task2, now), { kategori: "overdue", sisa_menit: 0 });
});

test("less than a minute overdue gives sisa_menit 0, never -0", () => {
  const now = new Date("2026-07-02T10:00:30+07:00");
  const result = categorizeTask(task2, now);
  assert.equal(result.kategori, "overdue");
  assert.ok(Object.is(result.sisa_menit, 0));
});

test("selesai is still flagged", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const done = { ...task2, status: "selesai" };
  assert.equal(categorizeTask(done, now).kategori, "mendekati");
});

test("seconds optional", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const withoutSeconds = categorizeTask({ ...task2, deadline: "2026-07-02T10:00" }, now);
  const withSeconds = categorizeTask({ ...task2, deadline: "2026-07-02T10:00:00" }, now);
  assert.deepEqual(withoutSeconds, withSeconds);
  assert.deepEqual(withoutSeconds, { kategori: "mendekati", sisa_menit: 60 });
});

test("parseWIB reads naive strings as +07:00 and keeps explicit zones", () => {
  assert.equal(parseWIB("2026-07-02T10:00").toISOString(), "2026-07-02T03:00:00.000Z");
  assert.equal(parseWIB("2026-07-02T10:00:00").toISOString(), "2026-07-02T03:00:00.000Z");
  assert.equal(parseWIB("2026-07-03T09:00:00.000Z").toISOString(), "2026-07-03T09:00:00.000Z");
  assert.equal(parseWIB("2026-07-02T10:00:00+07:00").toISOString(), "2026-07-02T03:00:00.000Z");
  assert.equal(parseWIB("2026-07-02T10:00:00-05:00").toISOString(), "2026-07-02T15:00:00.000Z");
});

test("parseWIB returns an Invalid Date for bad or non-string input without throwing", () => {
  for (const bad of ["", "bukan tanggal", "2026-13-45T10:00", "2026-07-02", undefined, null, 42, {}]) {
    const date = parseWIB(bad);
    assert.ok(date instanceof Date);
    assert.ok(Number.isNaN(date.getTime()), `expected Invalid Date for ${String(bad)}`);
  }
});

test("bad deadline", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  for (const deadline of ["", "bukan tanggal", undefined]) {
    assert.deepEqual(categorizeTask({ ...task1, deadline }, now), { kategori: "normal", sisa_menit: null });
  }
  const broken = [
    { ...task1, id: 10, deadline: "", created_at: "2026-06-01T09:00:00" },
    { ...task2, id: 11, deadline: "bukan tanggal", created_at: "2026-06-20T09:00:00" },
    { ...task3, id: 12, deadline: undefined, created_at: "2026-06-10T09:00:00" }
  ];
  let list;
  assert.doesNotThrow(() => {
    list = buildTaskList([...broken, task2], courses, now);
  });
  // Unparseable deadlines stay in the normal group, newest created_at first, after mendekati.
  assert.deepEqual(ids(list), [2, 11, 12, 10]);
  assert.deepEqual(list.slice(1).map((t) => t.sisa_menit), [null, null, null]);
});

test("normal group sorts by created_at across mixed formats, ties by id ascending", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const far = "2026-08-01T10:00";
  const list = buildTaskList(
    [
      { id: 5, deadline: far, created_at: "2026-06-15T09:00:00" }, // seed style, read as WIB
      { id: 4, deadline: far, created_at: "2026-06-15T09:00:00" }, // same instant, lower id first
      { id: 6, deadline: far, created_at: "2026-06-15T03:00:00.000Z" }, // UTC, 10:00 WIB: newest
      { id: 7, deadline: far, created_at: "garbage" } // unparseable created_at goes last
    ],
    courses,
    now
  );
  assert.deepEqual(ids(list), [6, 4, 5, 7]);
});

test("mendekati sorts nearest first and overdue least overdue first, ties by id", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const list = buildTaskList(
    [
      { id: 1, deadline: "2026-07-02T20:00", created_at: "2026-06-01T00:00:00" },
      { id: 2, deadline: "2026-07-02T09:30", created_at: "2026-06-01T00:00:00" },
      { id: 3, deadline: "2026-07-02T09:30", created_at: "2026-06-01T00:00:00" },
      { id: 4, deadline: "2026-07-01T09:00", created_at: "2026-06-01T00:00:00" },
      { id: 5, deadline: "2026-07-02T08:00", created_at: "2026-06-01T00:00:00" },
      { id: 6, deadline: "2026-07-02T08:00", created_at: "2026-06-01T00:00:00" }
    ],
    courses,
    now
  );
  assert.deepEqual(ids(list), [2, 3, 1, 5, 6, 4]);
});

test("host timezone irrelevant", (t) => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const script = `
    import { categorizeTask, buildTaskList } from ${JSON.stringify(MODULE_URL)};
    const tasks = ${JSON.stringify(tasks)};
    const courses = ${JSON.stringify(courses)};
    const now = new Date("2026-07-02T09:00:00+07:00");
    console.log(JSON.stringify({
      offset: new Date(2026, 0, 1).getTimezoneOffset(),
      categories: tasks.map((task) => categorizeTask(task, now)),
      list: buildTaskList(tasks, courses, now)
    }));
  `;
  const run = (TZ) => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, TZ },
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };

  const utc = run("UTC");
  const la = run("America/Los_Angeles");
  if (utc.offset === la.offset) {
    t.skip(`TZ env var is not honored by child processes on this host (offsets: ${utc.offset} and ${la.offset})`);
    return;
  }

  const expected = {
    categories: tasks.map((task) => categorizeTask(task, now)),
    list: JSON.parse(JSON.stringify(buildTaskList(tasks, courses, now)))
  };
  for (const out of [utc, la]) {
    assert.deepEqual(out.categories, expected.categories);
    assert.deepEqual(out.list, expected.list);
  }
});

test("mata_kuliah name attached", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const orphan = { ...task1, id: 9, mata_kuliah_id: 99 };
  const list = buildTaskList([task2, orphan], courses, now);
  const byId = Object.fromEntries(list.map((t) => [t.id, t]));
  assert.equal(byId[2].mata_kuliah, "Data Structures");
  assert.equal(byId[9].mata_kuliah, null);
  assert.equal(byId[2].judul, task2.judul);
});

test("buildTaskList does not mutate its input", () => {
  const now = new Date("2026-07-02T09:00:00+07:00");
  const snapshot = JSON.stringify(tasks);
  buildTaskList(tasks, courses, now);
  assert.equal(JSON.stringify(tasks), snapshot);
});
