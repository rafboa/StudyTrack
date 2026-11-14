# StudyTrack Deadline Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Academya SE case-study submission: a deck PDF and video script, plus a running StudyTrack with deadline flagging, an AI study-order advice feature, a Render deployment and a clean git history.

**Architecture:** Category (`mendekati` / `overdue` / `normal`) and remaining minutes are derived on the server per request from `deadline` (naive string, read as WIB `+07:00`) and an injectable clock. `GET /api/tasks` returns the tasks already ranked and labelled; the React card only renders `kategori`. The AI endpoint reuses the same ranked list and falls back through providers to a rule-based message.

**Tech Stack:** Node 20.19+/22.12+ (installed: v24.18.0), Express 4, JSON file storage, React 18 + Vite 8, `node:test` for tests, global `fetch` for LLM calls, Render for hosting.

**Spec:** `docs/superpowers/specs/2026-11-15-deadline-reminder-design.md` (approved 2026-11-15)

## Global Constraints

- Registration closes **2026-11-16 23:59 WIB**. Task 1 (deck) is required; Tasks 2-8 are bonuses and must not delay recording.
- "Mendekati deadline" = remaining time **strictly less than 24 hours** and greater than 0. Exactly 24 h is `normal`. Remaining `<= 0` is `overdue`. The 24 h value is a fixed constant, not configurable.
- `status` is ignored by categorization: a `selesai` task is flagged like any other.
- List order: `mendekati` (nearest deadline first), then `overdue` (least overdue first), then `normal` (`created_at` newest first). Ties break by `id` ascending.
- `deadline` strings are read as **Asia/Jakarta, fixed offset `+07:00`**, whatever the host timezone is. No task schema change; do not store the category.
- Response shape of `GET /api/tasks`: `{ tasks, server_time }`; each task adds `kategori` and `sisa_menit` (negative when overdue, `null` when the deadline is unparseable).
- Keep field names from the guidebook (`judul`, `deskripsi`, `deadline`, `status`, `mata_kuliah_id`, `created_at`, `user_id`; courses `name`, `kode`, `dosen`).
- User-facing UI text is Indonesian. Deck and video are Indonesian.
- API keys only in environment variables; `.env.example` lists names with no values; never commit a key. `backend/db.json` stays gitignored.
- Git: stay on branch `claude/guidebook-software-engineer-dcb8ef`, one descriptive commit per task, no attribution lines.

## Review Focus

1. **Deadline with and without seconds.** `datetime-local` gives `2026-07-03T23:59`; seed data has `2026-07-03T23:59:00`. Both must categorize identically (owned by Task 2).
2. **Unparseable or empty `deadline`** (the `PUT` route accepts any string). Must not throw or break the list: `kategori: "normal"`, `sisa_menit: null` (Task 2).
3. **Host timezone not WIB, and mixed `created_at` formats.** Results must be identical under `TZ=UTC` and `TZ=America/Los_Angeles`; seed `created_at` has no zone while new tasks are ISO UTC, and sort order must not depend on host timezone (Task 2).
4. **Page left open across the 24 h threshold.** A task must move to the top without a reload (Task 4, manual check).
5. **AI endpoint abuse and bad output.** Repeated clicks, provider timeout, empty or very long LLM output, and huge task text must not burn quota or break the page (Task 5).

---

### Task 1: Submission deck and video script (REQUIRED deliverable)

**Files:**
- Create: `docs/submission/deck-content.md` (slide-by-slide source, Indonesian)
- Create: `docs/submission/video-script.md`
- Create: `docs/submission/StudyTrack-Deck.pdf`
- Add to git: `docs/superpowers/specs/2026-11-15-deadline-reminder-design.md`, this plan

**Interfaces:**
- Consumes: spec section 4 (P1/P2/P3 table, Layer A/B/C, verification table). Section numbers are the single source of truth for deck content.
- Produces: `StudyTrack-Deck.pdf` (re-exported in Task 8) and the scenario numbering that Tasks 2-3 tests mirror.

- [ ] **Step 1: Write `deck-content.md`.** One heading per slide, in this order: title; P1 Perubahan; P2 pemetaan table (the guidebook says it is a tool, so one slide at most); P3 task table with the exact columns `No | Deskripsi Task | Layer | Ketergantungan | Catatan/Asumsi` (all three layers present); Layer A Database; Layer B Backend (pseudocode + input/output); Layer C Frontend (normal / mendekati / overdue sketches + deciding condition); verification table with columns `No. | Kondisi / Input | Hasil yang Diharapkan | Jenis Skenario` (at least one Positif, Negatif, Edge); consistency recap (DB field to backend field to frontend prop); bonuses (code, AI, deploy, git); closing. Copy task and scenario rows from the spec, do not re-derive.
- [ ] **Step 2: Write `video-script.md`.** A timed outline of about 10 minutes for the case study (about 1 min per slide) plus a closing of about 1 minute. For the 4-minute intro/motivation/experience part write only the three prompts from guidebook page 8 as headings; the user fills in their own content. State at the top: total video max 15 minutes, MP4/MOV/AVI, at least 480p, one continuous take.
- [ ] **Step 3: Build the PDF `docs/submission/StudyTrack-Deck.pdf` from `deck-content.md`** with any tool available locally (the `anthropic-skills:pptx` or `anthropic-skills:pdf` skill, or HTML printed to PDF in the in-app browser). Slides must be readable at full screen: no table text under 14 pt.
- [ ] **Step 4: Verify.** Open the PDF and check: every guidebook requirement in Step 1 is present; tables are not cut off; page count is shown. Expected: all items ticked, nothing clipped.
- [ ] **Step 5: Commit.**

```bash
git add docs/
git commit -m "docs: add case-study design, plan, deck content and video script"
```

---

### Task 2: Deadline categorization core

**Files:**
- Create: `backend/lib/deadline.js`
- Create: `backend/test/deadline.test.js`
- Modify: `backend/package.json` (add script `"test": "node --test"`)

**Interfaces:**
- Produces (all exported from `backend/lib/deadline.js`):
  - `NEAR_MS: number` = `86400000`
  - `parseWIB(value: string): Date`. Accepts `YYYY-MM-DDTHH:mm`, `YYYY-MM-DDTHH:mm:ss`; strings that already end in `Z` or `±hh:mm` are parsed as given; anything else yields an Invalid Date.
  - `categorizeTask(task: { deadline: string }, now: Date): { kategori: "mendekati" | "overdue" | "normal", sisa_menit: number | null }`. `sisa_menit = Math.trunc(remainingMs / 60000)`.
  - `buildTaskList(tasks: Task[], courses: Course[], now: Date): Array<Task & { mata_kuliah: string | null, kategori, sisa_menit }>` returns the ranked list described in Global Constraints. `created_at` goes through `parseWIB` for sorting.

- [ ] **Step 1: Write failing tests in `backend/test/deadline.test.js`** using the three seed tasks (copy them from `backend/db.js`) and `new Date("…+07:00")` clocks. Test names and assertions:
  - `seed at 2026-07-02T09:00+07:00`: task 2 → `{mendekati, 60}`; task 1 → `{normal, 2339}`; task 3 → `normal`; `buildTaskList` ids `[2, 3, 1]`.
  - `seed at 2026-07-04T00:00+07:00`: task 1 → `{overdue, -1}`; task 2 → `{overdue, -2280}`; task 3 → `normal`; ids `[1, 2, 3]`.
  - `exactly 24h is normal`: now `2026-07-01T10:00+07:00`, task 2 → `{normal, 1440}`; one minute later → `{mendekati, 1439}`.
  - `exactly 0 is overdue`: now `2026-07-02T10:00+07:00`, task 2 → `{overdue, 0}`.
  - `selesai is still flagged`: task 2 with `status: "selesai"` at `2026-07-02T09:00+07:00` → `mendekati`.
  - `seconds optional`: `"2026-07-02T10:00"` and `"2026-07-02T10:00:00"` give equal results.
  - `bad deadline`: `""`, `"bukan tanggal"` and `undefined` → `{normal, null}` and `buildTaskList` does not throw.
  - `host timezone irrelevant`: a test that runs `spawnSync(process.execPath, ["--input-type=module", "-e", <script>], { env: { ...process.env, TZ } })` for `TZ` in `UTC` and `America/Los_Angeles`, where the script imports `categorizeTask` and `buildTaskList` and prints JSON for the first seed scenario; assert both outputs equal the in-process result.
  - `mata_kuliah name attached`: course found gives its `name`; missing course gives `null`.
- [ ] **Step 2: Run `cd backend && npm test`.** Expected: FAIL, module `../lib/deadline.js` not found.
- [ ] **Step 3: Implement `backend/lib/deadline.js`** with the signatures above. Rank groups `mendekati=0, overdue=1, normal=2`; unparseable deadlines go to `normal` and sort by `created_at` like any normal task.
- [ ] **Step 4: Run `cd backend && npm test`.** Expected: `# fail 0`.
- [ ] **Step 5: Commit.**

```bash
git add backend/lib/deadline.js backend/test/deadline.test.js backend/package.json
git commit -m "feat(backend): derive task deadline category with WIB-fixed parsing"
```

---

### Task 3: Wire categorization into `GET /api/tasks`

**Files:**
- Create: `backend/app.js` (moved from `server.js`)
- Modify: `backend/server.js` (only listens), `backend/db.js` (`DB_PATH` from `process.env.DB_PATH`, falling back to the current path), `backend/routes/tasks.js:10-35`
- Test: `backend/test/tasks.api.test.js`

**Interfaces:**
- Consumes: `buildTaskList(tasks, courses, now)` from Task 2.
- Produces: `createApp(opts?: { now?: () => Date, providers?: Provider[] }): express.Express` in `backend/app.js`. It sets `app.locals.now = now` (default `() => new Date()`) and `app.locals.providers = providers ?? undefined` (consumed by Task 5). `GET /api/tasks` returns `{ tasks, server_time: now().toISOString() }`.

- [ ] **Step 1: Write failing tests.** In `tasks.api.test.js`, before importing anything set `process.env.DB_PATH` to a temp file; call `resetDB()`; start `createApp({ now: () => new Date("2026-07-02T09:00:00+07:00") }).listen(0)`; log in as the demo user (`demo@studytrack.test` / `demo1234`; read `routes/auth.js` for the exact body shape). Assertions:
  - `returns ranked tasks`: ids `[2, 3, 1]`, `kategori` `["mendekati","normal","normal"]`, `server_time` equals the injected clock's ISO string.
  - `requires login`: no token gives 401.
  - `only own tasks`: register a second user with a course and a task with deadline `2026-07-02T09:30`; that user's list has only that task, flagged `mendekati`; the demo user's list is unchanged.
  - `dev reset stays off in production`: with `NODE_ENV=production` at app creation, `POST /api/dev/reset` returns 404.
- [ ] **Step 2: Run `cd backend && npm test`.** Expected: FAIL, `../app.js` not found.
- [ ] **Step 3: Split `server.js`.** Move app construction into `createApp` in `app.js` (same routes, same dev-reset guard, same 404 fallback); `server.js` imports it and calls `listen(PORT)`. Keep the guidebook comments. Replace the sort in `routes/tasks.js` `GET /` with `buildTaskList(userTasks, db.courses, req.app.locals.now())`, and remove the stale "CATATAN UNTUK PESERTA" comment in favour of a short doc of the new response.
- [ ] **Step 4: Run `cd backend && npm test`.** Expected: `# fail 0`. Then start `npm run dev` and `curl -s localhost:4000/api/health` returns `{"status":"ok",…}`.
- [ ] **Step 5: Commit.**

```bash
git add backend/
git commit -m "feat(backend): return kategori and ranked order from GET /api/tasks"
```

---

### Task 4: Frontend markers and auto-refresh

**Files:**
- Create: `frontend/src/lib/formatSisa.js`, `frontend/src/lib/formatSisa.test.js`
- Modify: `frontend/src/components/TaskCard.jsx`, `frontend/src/pages/Tasks.jsx:19-27`, `frontend/src/index.css`, `frontend/package.json` (script `"test": "node --test src/lib"`)

**Interfaces:**
- Produces: `formatSisa(sisaMenit: number | null, kategori: "mendekati" | "overdue" | "normal"): string` in `frontend/src/lib/formatSisa.js`.
- Consumes: `task.kategori`, `task.sisa_menit` from Task 3.

- [ ] **Step 1: Write failing tests in `formatSisa.test.js`.**
  - `mendekati`: `(60,"mendekati")` → `"Sisa 1 j 0 m"`, `(59,…)` → `"Sisa 59 m"`, `(0,…)` → `"Sisa kurang dari 1 m"`, `(1439,…)` → `"Sisa 23 j 59 m"`.
  - `overdue`: `(-1,"overdue")` → `"Terlambat 1 m"`, `(-90,…)` → `"Terlambat 1 j 30 m"`, `(0,…)` → `"Terlambat kurang dari 1 m"`, `(-3000,…)` → `"Terlambat 2 hr 2 j"`.
  - `normal` or `null` → `""`.
- [ ] **Step 2: Run `cd frontend && npm test`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement `formatSisa`.**
- [ ] **Step 4: Run `cd frontend && npm test`.** Expected: all pass.
- [ ] **Step 5: Update `TaskCard`.** Root gets class `task-${task.kategori}` alongside `card task-card`. For `mendekati` and `overdue`, render a second badge before the status badge with text `Mendekati Deadline` or `Terlambat` plus the `formatSisa` line, so the marker never relies on colour alone. Add CSS classes `.task-mendekati`, `.task-overdue` and matching `.badge.mendekati`, `.badge.overdue` in the existing palette style (the two must be clearly different from each other and from `.badge.belum` yellow). Remove the stale participant note.
- [ ] **Step 6: Update `Tasks.jsx`.** Keep `loadData`; add an effect that calls it every 60 000 ms and on `window` `focus`, clears both on unmount, and swallows errors from background refreshes (initial load behaves as before).
- [ ] **Step 7: Manual verify in the in-app browser** (`npm run dev` in both folders, log in as demo, `curl -X POST localhost:4000/api/dev/reset` first). Expected: seed tasks all show `Terlambat`; add one task due in 2 hours → it appears first with `Mendekati Deadline` and `Sisa 1 j 59 m`; add one due in 24 h + 2 minutes → listed under normal; keep the page open 2 minutes without reloading → that task jumps to the top as `mendekati`. Check one screenshot per state for the deck.
- [ ] **Step 8: Commit.**

```bash
git add frontend/
git commit -m "feat(frontend): mark mendekati and overdue tasks and refresh periodically"
```

---

### Task 5: AI study-order advice backend

**Files:**
- Create: `backend/services/advice.js`, `backend/services/llm.js`, `backend/routes/ai.js`
- Modify: `backend/app.js` (mount `/api/ai`), `backend/.env.example`
- Test: `backend/test/advice.test.js`, add cases to `backend/test/tasks.api.test.js` or new `backend/test/ai.api.test.js`

**Interfaces:**
- Consumes: `buildTaskList`, `createApp({ now, providers })` from Tasks 2-3.
- Produces in `advice.js`:
  - `type Provider = { name: string, call: (prompt: string) => Promise<string> }`
  - `selectAdviceTasks(ranked: Task[]): Task[]` keeps `kategori` in `mendekati|overdue` and `status === "belum"`, order preserved.
  - `buildPrompt(tasks: Task[]): string` at most 10 tasks, `judul` and `deskripsi` cut to 200 chars, asks for short Indonesian advice on what to do first and why.
  - `ruleBasedAdvice(tasks: Task[]): string` deterministic Indonesian text listing tasks in given order.
  - `getAdvice(tasks: Task[], providers: Provider[]): Promise<{ saran: string, sumber: string }>`. No tasks: fixed message, `sumber: "none"`, zero provider calls. Otherwise try providers in order, treating a throw or a blank/whitespace result as failure; if all fail, `ruleBasedAdvice` with `sumber: "rule"`. Success returns `sumber` equal to the provider `name`; output is capped at 1500 chars.
- Produces in `llm.js`: `buildProviders(env?: NodeJS.ProcessEnv): Provider[]`. Gemini (`name: "gemini"`, env `GEMINI_API_KEY`, `GEMINI_MODEL`) first, then an OpenAI-compatible provider (`name: "fallback-llm"`, env `FALLBACK_LLM_BASE_URL`, `FALLBACK_LLM_API_KEY`, `FALLBACK_LLM_MODEL`), each included only when its key is set; every call uses `AbortSignal.timeout(8000)`. Check the current free-tier Gemini model name before choosing the default.
- Produces: `POST /api/ai/prioritas` (login required) returns `200 { saran, sumber, jumlah_tugas }`; a second call by the same user within 10 s of the previous returns `429 { error }` (in-memory, uses `app.locals.now`).

- [ ] **Step 1: Write failing tests.** `advice.test.js`: `selectAdviceTasks drops selesai and normal`; `getAdvice with no tasks makes no provider call`; `first provider wins and sumber is its name`; `throwing provider falls through to next`; `blank output counts as failure`; `all providers fail gives rule advice that lists the nearest task first`; `prompt is capped at 10 tasks and 200 chars per field`; `long output is capped at 1500 chars`. API test with injected fake providers and clock `2026-07-02T09:00+07:00`: demo user gets `{sumber: "fake", jumlah_tugas: 1}` (only task 2 qualifies); an immediate second call returns 429; advancing the clock by 11 s returns 200; no provider configured returns `sumber: "rule"`; unauthenticated returns 401.
- [ ] **Step 2: Run `cd backend && npm test`.** Expected: FAIL, modules not found.
- [ ] **Step 3: Implement `advice.js`, `llm.js`, `routes/ai.js`; mount in `app.js` with `providers ?? buildProviders()`.** Provider errors are never returned to the client and API keys are never logged. Append the five env var names (empty values) and a one-line comment to `.env.example`.
- [ ] **Step 4: Run `cd backend && npm test`.** Expected: `# fail 0`.
- [ ] **Step 5 (user action): add the user's own keys to `backend/.env`** (never in git) and run one real call: `curl -s -X POST localhost:4000/api/ai/prioritas -H "Authorization: Bearer <token>"`. Expected: `sumber` is `gemini` (or `fallback-llm` / `rule` if keys are missing). If the user has no key yet, record that and continue; the app still works through the rule-based path.
- [ ] **Step 6: Commit.**

```bash
git add backend/
git commit -m "feat(backend): add study-order advice endpoint with LLM fallback chain"
```

---

### Task 6: AI advice panel in the UI

**Files:**
- Create: `frontend/src/components/AdvicePanel.jsx`
- Modify: `frontend/src/pages/Tasks.jsx` (render the panel above the list), `frontend/src/index.css`

**Interfaces:**
- Consumes: `POST /api/ai/prioritas` from Task 5 and `api` from `frontend/src/api.js`.
- Produces: `AdvicePanel(): JSX.Element` with no props.

- [ ] **Step 1: Implement `AdvicePanel`.** A `Minta Saran Prioritas` button; disabled and labelled `Memproses…` while loading; shows the `saran` text as plain text with `white-space: pre-wrap` (never as HTML); a small caption by `sumber`: `gemini` → `Disusun oleh Gemini`, `fallback-llm` → `Disusun oleh model open-source`, `rule`/`none` → `Saran otomatis (tanpa AI)`; a 429 shows `Tunggu beberapa detik sebelum meminta saran lagi.`; other errors show a generic Indonesian message.
- [ ] **Step 2: Manual verify in the in-app browser.** Expected: with the demo data (seed tasks all overdue) the panel returns advice; the button is disabled while loading; a rapid second click shows the wait message; with providers unset the caption says `Saran otomatis (tanpa AI)`.
- [ ] **Step 3: Commit.**

```bash
git add frontend/
git commit -m "feat(frontend): add study-order advice panel"
```

---

### Task 7: Single-service Render deployment

**Files:**
- Modify: `backend/app.js` (static serving), `README.md` (deployment section)
- Create: `render.yaml`
- Test: `backend/test/static.test.js`

**Interfaces:**
- Consumes: `createApp` from Task 3.
- Produces: when `frontend/dist/index.html` exists, `createApp` serves `frontend/dist` and returns `index.html` for any non-`/api` GET; `/api/*` unknown paths still return the existing 404 JSON.

- [ ] **Step 1: Write failing tests.** In `static.test.js`, create a temp `dist` via a `distDir` option on `createApp` (add it with default `../frontend/dist`) and assert: `GET /` and `GET /tasks` return the temp `index.html`; `GET /api/health` still returns JSON; `GET /api/nope` returns 404 JSON; with no `dist` folder `GET /` returns the old JSON 404.
- [ ] **Step 2: Run `cd backend && npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement static serving** after the API routes and before the 404 fallback.
- [ ] **Step 4: Create `render.yaml`:** one `web` service, `runtime: node`, `buildCommand` installs and builds the frontend then installs the backend (`npm --prefix frontend ci && npm --prefix frontend run build && npm --prefix backend ci`), `startCommand: npm --prefix backend start`, env `NODE_ENV=production`, `NODE_VERSION=22`, `JWT_SECRET` with `generateValue: true`, and the five LLM vars with `sync: false`.
- [ ] **Step 5: Local production smoke test.** Run `npm --prefix frontend run build`, then `NODE_ENV=production node backend/server.js`. Expected: `http://localhost:4000/` shows the login page, log in works, `/tasks` refresh works, `POST /api/dev/reset` returns 404.
- [ ] **Step 6: README section.** Document the Render steps, the free-tier `db.json` reset on redeploy, and the cold start after inactivity (open the URL a few minutes before recording or sharing).
- [ ] **Step 7: Commit.**

```bash
git add backend/ render.yaml README.md
git commit -m "feat(deploy): serve built frontend from Express and add Render blueprint"
```

- [ ] **Step 8 (user action): push the branch and deploy.** The user pushes to their GitHub repository, creates the Render service from `render.yaml`, and sets the LLM keys in Render's environment settings. The agent cannot do this. Expected: a public URL where the demo login works and the advice button responds; paste the URL back so Task 8 can use it.

---

### Task 8: Final README, screenshots and deck refresh

**Files:**
- Modify: `README.md` (feature, formula, API change, how to run tests), `docs/submission/deck-content.md`, `docs/submission/video-script.md`, `docs/submission/StudyTrack-Deck.pdf`

**Interfaces:**
- Consumes: screenshots from Task 4, the public URL from Task 7, and test output from Tasks 2-5.

- [ ] **Step 1: Run `cd backend && npm test && cd ../frontend && npm test` and `npm --prefix frontend run build`.** Expected: all tests pass, build succeeds. Paste the pass counts into the deck.
- [ ] **Step 2: Update `README.md`** with the new `GET /api/tasks` response, `POST /api/ai/prioritas`, the `kategori` rules, and `npm test`.
- [ ] **Step 3: Update the deck.** Add screenshots of the three card states, a bonuses slide with the public URL, the AI advice and the test results, and check the verification table still matches the real test cases (same numbers). Re-export `StudyTrack-Deck.pdf`.
- [ ] **Step 4: Update `video-script.md`** with a short live-demo segment (30-60 s) only if the 10-minute budget still holds; otherwise leave it out.
- [ ] **Step 5: Open the PDF and verify** every guidebook item again (Task 1, Step 1 list) and that it fits the video's 15-minute limit when read at the script's pace.
- [ ] **Step 6: Commit.**

```bash
git add README.md docs/submission
git commit -m "docs: finalize README and submission deck with demo evidence"
```

- [ ] **Step 7 (user action): record and upload.** The user records the single continuous video (intro, motivation, experience, then the case study), then uploads the PDF and video, finishes the admin files and the competency test on the Academya site, and submits before 2026-11-16 23:59 WIB.

---

## Self-Review

- **Spec coverage:** F01-F04, ordering and boundaries (Tasks 2-3); selesai flagged (Task 2 test); WIB (Task 2); refresh (Task 4); AI advice with Gemini then open-source then rule fallback (Tasks 5-6); Render single service (Task 7); deck, verification table and video script (Tasks 1, 8); git history (one commit per task). Spec section 8 builder choices (styling, test runner, polling interval, deck tooling, prompt wording) are left open as intended.
- **Type consistency:** `parseWIB`, `categorizeTask`, `buildTaskList`, `kategori`, `sisa_menit`, `createApp({ now, providers })`, `Provider`, `sumber` values `gemini` / `fallback-llm` / `rule` / `none` are used with the same names across Tasks 2-8.
- **Proportion:** the plan is about 1.7 times the spec's length; bodies are replaced by signatures and assertions.
