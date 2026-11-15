# StudyTrack Baseline

Starter kit untuk bonus **Implementasi kode nyata** pada studi kasus seleksi Software Engineer, Academya Arkavidia 11.0.

Isinya adalah StudyTrack dengan empat modul bawaan (autentikasi, manajemen mata kuliah, manajemen tugas, dan halaman daftar tugas) **ditambah fitur Reminder Tugas Mendekati Deadline** yang sudah dikerjakan: kategori deadline per tugas, penanda pada card, urutan baru, serta saran urutan belajar berbasis AI sebagai bonus. Rancangan lengkapnya ada di `docs/superpowers/specs/2026-11-15-deadline-reminder-design.md`.

> Starter kit ini bersifat opsional. Anda boleh memakai stack lain selama struktur datanya konsisten dengan Bagian 1 (Konteks Aplikasi) pada dokumen studi kasus.

## Stack

- **Backend:** Node.js + Express. Data disimpan di file JSON, jadi tidak perlu memasang database terpisah.
- **Frontend:** React + Vite.

## Prasyarat

- Node.js 20.19 atau lebih baru (atau 22.12+), sesuai syarat Vite 8.
- npm.

## Fitur yang Sudah Tersedia

- Registrasi, login, dan logout. Password di-hash dengan bcrypt dan sesi memakai JWT.
- Manajemen Mata Kuliah: lihat, tambah, dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Manajemen Tugas per mata kuliah: lihat, tambah, ubah status (belum/selesai), dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Halaman Daftar Tugas: seluruh tugas pengguna lintas mata kuliah.

Fitur Reminder Tugas Mendekati Deadline:

- Setiap tugas diberi `kategori` (`mendekati`, `overdue`, atau `normal`) dan `sisa_menit` yang **dihitung di backend** saat request. Skema data tidak berubah. Aturannya ada di bagian "Aturan Kategori Deadline".
- Daftar tugas diurutkan mendekati, lalu overdue, lalu normal. Card tugas menampilkan penanda berlabel teks ("Mendekati Deadline" atau "Terlambat") dan sisa waktunya. Halaman mengambil ulang data tiap 60 detik dan saat jendela mendapat fokus.
- Panel **Saran Urutan Belajar** (bonus AI): tombol "Minta Saran Prioritas" memanggil `POST /api/ai/prioritas`. Penyedia saran berurutan: Gemini, lalu model open-source (API kompatibel OpenAI), lalu pesan berbasis aturan bila keduanya tidak tersedia atau gagal.
- Frontend hasil build bisa disajikan oleh Express dan di-deploy sebagai satu layanan di Render (lihat bagian Deployment).

## Cara Menjalankan

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend berjalan di `http://localhost:4000`. Port dan `JWT_SECRET` bisa diatur lewat file `.env`.

### 2. Frontend

Buka terminal baru, lalu jalankan:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Selama mode development, request `/api/*` otomatis diteruskan ke backend oleh proxy Vite.

### 3. Variabel Environment (opsional, untuk saran AI)

Saran urutan belajar bekerja tanpa konfigurasi apa pun karena memakai aturan bawaan. Untuk memakai model AI, isi variabel berikut di `backend/.env` (nilainya milik Anda sendiri, jangan di-commit):

| Variabel | Keterangan |
| --- | --- |
| `GEMINI_API_KEY` | Kunci API Gemini (Google AI Studio). Provider pertama. |
| `GEMINI_MODEL` | Nama model Gemini. Kosong berarti model bawaan. |
| `FALLBACK_LLM_BASE_URL` | Alamat API kompatibel OpenAI (mis. OpenRouter atau Groq) untuk model open-source. |
| `FALLBACK_LLM_API_KEY` | Kunci API untuk provider cadangan. |
| `FALLBACK_LLM_MODEL` | Nama model open-source untuk provider cadangan. |

Tiap provider hanya dipakai bila kuncinya diisi.

### 4. Menjalankan Test

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

Test backend memakai `node --test` (kategori dan urutan deadline, autentikasi, endpoint tugas dan AI, provider LLM dengan provider tiruan, penyajian frontend, konfigurasi production). Test frontend memeriksa format sisa waktu. Tidak ada test yang memanggil layanan AI sungguhan. Build frontend: `npm --prefix frontend run build`.

### 5. Akun Demo

File `backend/db.json` dibuat otomatis saat backend pertama kali dijalankan dan langsung berisi data seed. Anda bisa masuk dengan akun berikut:

| Email | Password |
| --- | --- |
| `demo@studytrack.test` | `demo1234` |

Untuk mengembalikan data ke kondisi seed kapan pun:

```bash
curl -X POST http://localhost:4000/api/dev/reset
```

Endpoint ini hanya aktif selama `NODE_ENV` bukan `production`.

## Struktur Data

Struktur ini mengikuti Bagian 1 (Konteks Aplikasi) pada dokumen studi kasus. Kolom `user_id` ditambahkan di luar daftar itu supaya setiap mahasiswa hanya melihat datanya sendiri.

**Mata kuliah** (`courses`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `name` | string | Nama mata kuliah |
| `kode` | string | Kode mata kuliah, contoh: `CS 186` |
| `dosen` | string | Nama dosen pengampu |
| `user_id` | integer | Pemilik data |

**Tugas** (`tasks`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `judul` | string | Judul tugas |
| `deskripsi` | string | Deskripsi atau catatan tambahan |
| `deadline` | datetime | Batas pengumpulan |
| `status` | enum | `belum` atau `selesai` |
| `mata_kuliah_id` | integer | Referensi ke mata kuliah terkait |
| `created_at` | datetime | Waktu tugas ditambahkan |
| `user_id` | integer | Pemilik data |

> **Format waktu.** `deadline` disimpan sebagai waktu lokal tanpa zona waktu, persis seperti keluaran input `datetime-local` (contoh: `2026-07-03T23:59`). Sementara itu `created_at` pada tugas baru berformat ISO 8601 UTC (contoh: `2026-10-23T09:00:00.000Z`). Perhatikan perbedaan ini saat Anda menghitung sisa waktu hingga deadline.

## Data Seed

Data awal sama dengan contoh pada dokumen studi kasus:

| ID | Judul | Mata Kuliah | Deadline | Status |
| --- | --- | --- | --- | --- |
| 1 | Lab 4: Query Optimization Report | CS 186, Database Systems | 2026-07-03 23:59 | belum |
| 2 | Project 3: BSTMap Implementation | CS 61B, Data Structures | 2026-07-02 10:00 | belum |
| 3 | Sprint 2: Backend API Integration | CS 169, Software Engineering | 2026-07-06 23:59 | belum |

Tanggal pada data seed mengikuti dokumen, sehingga di aplikasi semuanya tampil sebagai terlambat (`overdue`). Untuk melihat kategori `mendekati`, tambahkan tugas baru dengan deadline kurang dari 24 jam lagi lewat form **Tambah Tugas**; deadline yang lebih jauh tampil sebagai `normal`.

## Ringkasan API

Semua endpoint di bawah `/api`. Endpoint bertanda "Ya" membutuhkan header `Authorization: Bearer <token>`. Token ditolak dengan `401` bila akun pemiliknya sudah tidak ada (mis. `db.json` kembali ke seed) atau emailnya berbeda; login ulang diperlukan.

| Method | Path | Login | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/health` | Tidak | Cek status server |
| `POST` | `/auth/register` | Tidak | Daftar akun baru |
| `POST` | `/auth/login` | Tidak | Login, mengembalikan token |
| `GET` | `/auth/me` | Ya | Profil pengguna yang sedang login |
| `GET` | `/courses` | Ya | Daftar mata kuliah |
| `POST` | `/courses` | Ya | Tambah mata kuliah |
| `PUT` | `/courses/:id` | Ya | Ubah mata kuliah |
| `DELETE` | `/courses/:id` | Ya | Hapus mata kuliah beserta tugasnya |
| `GET` | `/tasks` | Ya | Daftar seluruh tugas pengguna, lintas mata kuliah, dengan `kategori` dan `sisa_menit`, sudah terurut |
| `GET` | `/tasks/:id` | Ya | Detail satu tugas |
| `POST` | `/tasks` | Ya | Tambah tugas (`mata_kuliah_id`, `judul`, `deadline`, `deskripsi?`); `400` bila `deadline` tidak bisa dibaca |
| `PUT` | `/tasks/:id` | Ya | Ubah tugas, termasuk status; `400` bila `deadline` yang dikirim tidak bisa dibaca |
| `DELETE` | `/tasks/:id` | Ya | Hapus tugas |
| `POST` | `/ai/prioritas` | Ya | Saran urutan belajar untuk tugas mendekati dan terlambat |
| `POST` | `/dev/reset` | Tidak | Reset data ke seed (hanya di luar production) |

### `GET /api/tasks`

Mengembalikan objek berisi daftar tugas yang sudah terurut dan waktu server:

```json
{
  "tasks": [
    {
      "id": 2,
      "judul": "Project 3: BSTMap Implementation",
      "deadline": "2026-07-02T10:00:00",
      "status": "belum",
      "mata_kuliah_id": 2,
      "mata_kuliah": "Data Structures",
      "kategori": "mendekati",
      "sisa_menit": 60
    }
  ],
  "server_time": "2026-07-02T02:00:00.000Z"
}
```

Contoh di atas dipersingkat (field lain seperti `deskripsi`, `created_at`, dan `user_id` tetap ada). `server_time` berformat ISO 8601 UTC. `sisa_menit` bernilai `null` bila `deadline` tidak bisa dibaca; tugas itu masuk kelompok `normal`.

### `POST /api/ai/prioritas`

Tanpa body. Server sendiri memilih tugas milik pengguna yang `kategori`-nya `mendekati` atau `overdue` dan belum selesai, lalu meminta saran urutan pengerjaan.

- `200` `{ "saran": "...", "sumber": "gemini" | "fallback-llm" | "rule" | "none", "jumlah_tugas": 4 }`. `sumber` menyebut siapa yang menjawab: `gemini`, model open-source cadangan (`fallback-llm`), atau pesan berbasis aturan (`rule`). Nilai `none` dipakai bila tidak ada tugas yang perlu disarankan.
- `429` bila pengguna yang sama memanggil lagi dalam 10 detik (batas laju).
- `500` untuk kegagalan internal; isi error tidak dikirim ke klien dan batas laju dilepas.

Pesan error dan kunci API provider tidak pernah dikirim ke klien. Hanya field tugas (judul, mata kuliah, `deskripsi`, kategori, sisa waktu) yang dikirim ke provider AI, bukan data profil. `deskripsi` dipotong 200 karakter, sama seperti judul dan mata kuliah. Kegagalan provider dicatat di log server hanya dengan nama provider dan pesan error, tanpa kunci API, isi permintaan, maupun isi respons.

## Aturan Kategori Deadline

Kategori dihitung dari `deadline` dan waktu server saat ini, bukan disimpan di database. `deadline` bertipe waktu lokal tanpa zona dan **selalu dibaca sebagai WIB (+07:00)**, sehingga zona waktu server tidak berpengaruh.

Misalkan `sisa` = `deadline` dikurangi waktu sekarang:

| Kondisi | `kategori` |
| --- | --- |
| `sisa <= 0` (tepat 0 termasuk) | `overdue` |
| `0 < sisa < 24 jam` (kurang dari 24 jam secara ketat) | `mendekati` |
| `sisa >= 24 jam` (tepat 24 jam termasuk) | `normal` |

- `status` diabaikan: tugas yang sudah `selesai` tetap mendapat kategori dan penanda sesuai deadline-nya.
- `sisa_menit` dibulatkan ke arah nol (`trunc`); bernilai nol atau negatif bila `overdue`.
- Urutan daftar: `mendekati` (paling dekat dulu), lalu `overdue` (yang paling baru lewat dulu), lalu `normal` (`created_at` terbaru dulu). Bila sama, urut `id` naik.

## Struktur Proyek

```
studytrack-baseline/
├── render.yaml              # Blueprint Render (satu layanan web)
├── backend/
│   ├── server.js            # Entry point Express
│   ├── app.js               # createApp({ now, providers, distDir }): route, static frontend
│   ├── config.js            # Membaca .env (PORT, JWT_SECRET)
│   ├── db.js                # Penyimpanan JSON file dan data seed
│   ├── lib/deadline.js      # parseWIB, categorizeTask, buildTaskList (kategori dan urutan)
│   ├── middleware/auth.js   # Verifikasi JWT
│   ├── routes/
│   │   ├── auth.js          # Register, login, profil
│   │   ├── courses.js       # CRUD mata kuliah
│   │   ├── tasks.js         # CRUD tugas; GET / mengembalikan { tasks, server_time }
│   │   └── ai.js            # POST /api/ai/prioritas (batas laju 10 detik)
│   ├── services/
│   │   ├── advice.js        # Pemilihan tugas, prompt, rantai fallback, saran aturan
│   │   └── llm.js           # Provider Gemini dan provider kompatibel OpenAI
│   └── test/                # node --test (deadline, API tugas dan AI, LLM, static, config)
├── frontend/
│   └── src/
│       ├── main.jsx, App.jsx, AuthContext.jsx, api.js
│       ├── lib/
│       │   └── formatSisa.js  # Teks sisa waktu (+ formatSisa.test.js)
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── TaskCard.jsx   # Card tugas dengan penanda mendekati dan terlambat
│       │   └── AdvicePanel.jsx # Panel Saran Urutan Belajar
│       └── pages/
│           ├── Login.jsx, Register.jsx
│           ├── Courses.jsx
│           └── Tasks.jsx    # Halaman Daftar Tugas (refresh tiap 60 detik dan saat fokus)
└── docs/
    ├── superpowers/         # Spesifikasi dan rencana fitur
    └── submission/          # Deck (deck.html, PDF), naskah video, screenshot
```

## Titik Awal Fitur "Reminder Tugas Mendekati Deadline"

Fitur ini sudah diimplementasikan. Penunjuk "CATATAN UNTUK PESERTA STUDI KASUS" pada starter kit sudah diganti dengan kodenya:

- Logika kategori, `sisa_menit`, dan urutan: `backend/lib/deadline.js` (diuji di `backend/test/deadline.test.js`).
- Endpoint daftar tugas: `backend/routes/tasks.js` (`GET /api/tasks`).
- Saran urutan belajar: `backend/routes/ai.js`, `backend/services/advice.js`, dan `backend/services/llm.js`.
- Penanda pada card: `frontend/src/components/TaskCard.jsx` dengan `frontend/src/lib/formatSisa.js`.
- Panel saran dan refresh berkala: `frontend/src/components/AdvicePanel.jsx` dan `frontend/src/pages/Tasks.jsx`.
- Rancangan, rencana, dan bahan presentasi: `docs/superpowers/` dan `docs/submission/`.

## Deployment ke Render

Aplikasi di-deploy sebagai satu layanan web: Express melayani API sekaligus frontend hasil build (`frontend/dist`), sehingga tidak perlu mengatur URL backend terpisah.

1. Push repositori ke GitHub.
2. Di dashboard Render, pilih **New > Blueprint**, hubungkan repositori, lalu Render membaca `render.yaml` di root proyek.
3. Isi variabel environment berikut di dashboard Render (hanya nama, nilainya milik Anda sendiri):
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `FALLBACK_LLM_BASE_URL`
   - `FALLBACK_LLM_API_KEY`
   - `FALLBACK_LLM_MODEL`

   Kelimanya opsional. Bila dikosongkan, saran urutan belajar memakai aturan bawaan. `NODE_ENV`, `NODE_VERSION`, dan `JWT_SECRET` sudah diatur oleh `render.yaml` (`JWT_SECRET` dibuat acak oleh Render). Saat `NODE_ENV=production`, backend menolak start jika `JWT_SECRET` kosong.
4. Tunggu build selesai, lalu buka URL publik layanan dan masuk dengan akun demo.

Hal yang perlu diketahui pada paket gratis:

- `db.json` dikembalikan ke data seed setiap kali layanan di-redeploy atau di-restart, karena penyimpanan file bersifat sementara.
- Layanan tidur setelah beberapa waktu tidak diakses, jadi request pertama setelah idle lambat. Buka URL beberapa menit sebelum merekam atau membagikannya.
- Deadline pada data seed jatuh di Juli 2026, sehingga di demo tugas-tugas tersebut tampil sebagai terlambat sampai tugas baru ditambahkan.
- Endpoint `POST /api/dev/reset` tidak tersedia di production.

## Catatan

- Starter kit ini sengaja dibuat minimal. Fitur reminder deadline sudah dikerjakan; bonus AI/LLM (saran urutan belajar) dan konfigurasi deployment Render juga sudah ada. Alamat publik belum ada sebelum Anda melakukan deploy sendiri.
- Anda boleh memigrasikan penyimpanan dari file JSON ke database sungguhan (SQLite, PostgreSQL, dan sebagainya), tetapi itu tidak wajib.
- **Git history.** Salin starter kit ini ke repositori Anda sendiri dan commit kondisi awalnya lebih dulu, lalu kerjakan fitur di branch terpisah dengan commit message yang deskriptif.
- **Deployment.** Proxy Vite hanya berlaku saat `npm run dev`. Untuk production, Express menyajikan frontend hasil build dari layanan yang sama, jadi `baseURL` di `frontend/src/api.js` tidak perlu diubah. Langkah lengkapnya ada di bagian [Deployment ke Render](#deployment-ke-render) (termasuk `JWT_SECRET` dan `NODE_ENV=production`). Penyimpanan file di layanan gratis seperti Render atau Railway bersifat sementara, sehingga `db.json` kembali ke data seed saat redeploy atau restart.
