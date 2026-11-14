# StudyTrack: Reminder Tugas Mendekati Deadline — Design

Status: **DRAFT, awaiting approval.** Nothing has been built.
Date: 2026-11-15. Registration for Academya Arkavidia 11.0 (Software Engineer) closes **2026-11-16 23:59 WIB**.

## 1. Intent and why

This work is the case-study submission for the Academya Arkavidia 11.0 Software Engineer selection. The Video Assessment is 70% of the final score, and 70% of that is the case study, so the case study is about 49% of the total. Graders weight **correctness of the flagging logic** over visual complexity (guidebook, "Catatan").

Required deliverables (what is actually scored):

1. **Slide deck PDF** covering Tugas 1 (3P task table), Tugas 2 (design per layer) and Tugas 3 (verification table, 3+ scenarios).
2. **One continuous video, 15 minutes max.** Intro, motivation and experience take about 4 minutes. The case study takes about 10 minutes and the closing about 1 minute. MP4, MOV or AVI, at least 480p.

The user chose to also do **all four bonuses**: real running code, an AI/LLM feature, public deployment, and clean git history. Bonuses do not hurt anyone who skips them, but the user wants to show more. Time ordering therefore matters: **the required deck comes first, bonuses never delay recording.**

## 2. Goals, non-goals, anti-goals

**Goals**
- F01: a task is "mendekati deadline" when remaining time is **strictly less than 24 hours**.
- F02: mendekati tasks are shown at the very top, with a clear visual marker.
- F03: overdue tasks stay visible with a marker **different** from mendekati.
- F04: applies to all of the logged-in user's tasks across all courses.
- A deck whose three layers (DB, Backend, Frontend) are consistent with each other and with the code.
- A running, publicly reachable app and an AI "study-order advice" feature.

**Non-goals**
- Making the 24-hour threshold user-configurable (spec says fixed for this version).
- Push, email or browser notifications.
- Migrating storage off the JSON file (allowed by the starter kit but not needed).
- Multi-timezone support.
- Supporting `PUT`/edit of tasks in the UI beyond what exists.

**Anti-goals (failure even if it "works")**
- Wrong categories because of timezone drift. On a UTC cloud host, `new Date("2026-07-03T23:59")` is parsed in server time and is off by 7 hours for WIB users.
- Categories that disagree between deck, code and tests.
- Spending recording-prep time on bonuses.
- Committing an API key.

## 3. Decisions made by the user

| Topic | Decision |
|---|---|
| Scope | Deck + real code + deployment + AI feature (all bonuses) |
| Time available | 12+ hours before recording |
| Completed tasks (`status = selesai`) | **Flagged like any other task.** Category depends only on the deadline, as the spec literally says. (Revised from the first draft, which exempted them.) |
| Sort order | **Mendekati → Overdue → Normal** |
| Timezone | **Server fixed to Asia/Jakarta (WIB)** |
| AI feature | **Study-order advice**: a button that summarizes mendekati/overdue tasks and suggests what to do first |
| LLM provider | **Gemini**, with a **free open-source LLM as fallback**; free tier preferred, premium only if offered later |
| Deployment | **Single Render service**: Express serves the built React app, one public URL |

## 4. Design (structured as the deck will be)

### Tugas 1: Perencanaan Teknis (3P)

**P1: Perubahan**

1. *Data baru?* No new stored data. Category and remaining time are **derived** from `deadline`, `status` and the current time.
2. *Logika baru?* Yes. Categorize each task (`mendekati`, `overdue`, `normal`) and sort in groups.
3. *Tampilan baru?* Yes. Distinct markers for mendekati and overdue on the task card, plus the new order.

**P2: Pemetaan ke layer**

| Perubahan | Database | Backend | Frontend |
|---|---|---|---|
| Category & remaining time derived | Not affected | Affected | Not affected |
| Group sort (mendekati, overdue, normal) | Not affected | Affected | Not affected |
| Visual markers & refresh | Not affected | Not affected | Affected |

**P3: Task table (draft; the deck uses this)**

| No | Deskripsi Task | Layer | Ketergantungan | Catatan / Asumsi |
|---|---|---|---|---|
| 1 | Document the decision **not** to change the task schema; optionally describe an index on `(user_id, deadline)` for a real DB | Database | - | A stored category goes stale as time passes, so it is computed per request. `deadline` is naive local time and is treated as WIB. |
| 2 | Write `parseDeadlineWIB(deadline)` that turns `YYYY-MM-DDTHH:mm` into an absolute instant using the fixed `+07:00` offset | Backend | - | Server host timezone must not matter. |
| 3 | Write `categorizeTask(task, now)` returning `{kategori, sisa_menit}`: `mendekati` if `0 < remaining < 24h`, `overdue` if `remaining <= 0`, else `normal`; `status` is ignored | Backend | 2 | `now` is injectable for tests. Exactly 24h is `normal`. Exactly 0 is `overdue` (the time is up). Done tasks are flagged too (user decision, follows F01 literally). |
| 4 | Update `GET /api/tasks` to attach `kategori` and `sisa_menit`, sort mendekati (nearest first), overdue (most recently passed first), normal (`created_at` newest first), and return `server_time` | Backend | 3 | Matches F02/F03/F04. Sorting lives on the server so one source of truth exists. |
| 5 | Add `kategori`-driven marker to `TaskCard` (normal / mendekati / overdue) with text label, not color alone | Frontend | 4 | Spec says logic correctness beats visual complexity. |
| 6 | Make the Tasks page refetch every 60 s and on window focus | Frontend | 4 | A page left open must not show stale categories. |
| 7 | Add unit tests for `categorizeTask` using the seed table with fixed `now` | Backend | 3 | Same cases become the Tugas 3 table. |
| 8 | Add `POST /api/ai/prioritas` + UI button for study-order advice, with fallback chain | Backend + Frontend | 4 | See section 6. Not required by F01–F04. |

### Tugas 2: Rancangan teknis

**Layer A, Database.** No schema change. Task fields (`id, judul, deskripsi, deadline, status, mata_kuliah_id, created_at, user_id`) already carry everything needed. A persisted `kategori` column would become wrong as time passes, which needs a background job to repair, so we derive it. With a real DB, an index on `(user_id, deadline)` helps if filtering moves into SQL.

**Layer B, Backend.**

```
WIB_OFFSET = "+07:00"
parseDeadlineWIB(s)  -> Date   // new Date(s + ":00" + WIB_OFFSET)
categorizeTask(task, now):
  // status is intentionally ignored: category depends only on the deadline
  remainingMs = parseDeadlineWIB(task.deadline) - now
  if remainingMs <= 0:                  overdue
  else if remainingMs < 24*3600*1000:   mendekati
  else:                                 normal
  sisa_menit = floor(remainingMs / 60000)   // negative when overdue
GET /api/tasks:
  now = new Date()
  tasks = userTasks.map(add kategori, sisa_menit, mata_kuliah)
  sort by group rank (mendekati=0, overdue=1, normal=2), then within group:
     mendekati: sisa_menit asc
     overdue:   sisa_menit desc (least overdue first)
     normal:    created_at desc
  respond { tasks, server_time: now.toISOString() }
```

**Layer C, Frontend.** `TaskCard` reads `task.kategori`.
- `normal`: current card, unchanged.
- `mendekati`: highlighted card plus a badge "Mendekati Deadline" with the time left (for example "sisa 1 j 0 m").
- `overdue`: a visually different card plus a badge "Terlambat" with how late.

The page refetches every 60 seconds and on focus, so the top of the list stays correct. Markers always include text, so they do not rely on color alone.

### Tugas 3: Verifikasi (derived from the seed table, fixed `now`)

| No | Kondisi / Input | Hasil yang diharapkan | Jenis |
|---|---|---|---|
| 1 | `now = 2026-07-02 09:00` WIB; task 2 deadline `07-02 10:00` | Task 2 is `mendekati` (about 60 min left) and appears first | Positif |
| 2 | Same `now`; task 1 (`07-03 23:59`) and task 3 (`07-06 23:59`) | Both `normal` (about 39 h and more), ordered by `created_at` | Positif |
| 3 | `now = 2026-07-04 00:00`; task 1 and task 2 | Both `overdue`, still listed, with the overdue marker, not the mendekati marker | Negatif |
| 4 | Task 2 with `status = selesai` and `now = 2026-07-02 09:00` | Still `mendekati` (status does not change the category); the card also shows the "Selesai" status badge | Edge |
| 5 | `now = 2026-07-01 10:00`; task 2 (exactly 24 h left) | `normal` (strictly less than 24 h) | Edge |
| 6 | `now = 2026-07-02 10:00`; task 2 (remaining exactly 0) | `overdue` | Edge |
| 7 | Server host timezone set to UTC | Same results as WIB host | Edge |
| 8 | Another user's near-deadline task | Not returned (F04: only own tasks) | Negatif |

## 5. Deployment (decided)

- One Render web service. Express serves the built React app, so there is one URL and no CORS.
- `NODE_ENV=production`, random `JWT_SECRET`, and all keys set in Render's environment settings (user does this).
- Known limitation, to be stated in the deck/README: free-tier `db.json` resets to seed on redeploy or restart.
- The seed deadlines are all in 2026-07, so the public demo will show them as overdue until fresh tasks are added. **Builder's call:** whether to add a helper so a demo reviewer can see a mendekati task quickly.

## 6. AI feature: study-order advice

- `POST /api/ai/prioritas` (auth required). The server selects the user's own `mendekati` and `overdue` tasks that are still `belum` (advice about finished work is pointless; my call, since the list itself now flags done tasks too). The client does **not** send the task list.
- Prompt asks for a short Indonesian explanation of what to do first and why. The response is rendered as plain text, never HTML.
- Provider chain, **my call, needs the user's OK**: Gemini first, then an open-source model through a free OpenAI-compatible endpoint, then a deterministic rule-based message if both fail. This means the user may need a second free key.
- Keys live only in environment variables. `.env.example` lists names, never values.
- If there are no mendekati or overdue tasks, return a fixed message and make no LLM call.

## 7. Constraints

- Time: about 12+ hours before recording. Required deck is done first.
- Starter kit stack stays: Node 20.19+/22.12+, Express, JSON file storage, React + Vite.
- Data structure must stay consistent with the guidebook (Bagian 1).
- Git: build on the existing feature branch (clean baseline commit exists), one descriptive commit per step.

## 8. Left to the builder

- Exact visual styling of markers (colors, icons), as long as text labels exist.
- Test runner choice (`node:test` is enough).
- Polling interval tuning (60 s suggested).
- Deck production tooling and slide layout.
- Prompt wording for the AI feature.

## 9. My calls (please check)

- Exact boundary: `remaining <= 0` is overdue; `remaining == 24 h` is normal.
- Overdue sorted least-overdue first.
- Consequence of flagging done tasks: a finished task near its deadline still sits at the top. I kept it literal and did not add a "done goes lower" rule. Say if you want one.
- The AI advice only looks at unfinished (`belum`) tasks.
- Deck and video language: **Indonesian**, matching the guidebook (my guess).
- AI fallback chain details and the second key.
- I will write a roughly 10-minute talk outline for the video, but **you record it yourself**.
