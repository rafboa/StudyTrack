# StudyTrack: Reminder Tugas Mendekati Deadline (isi slide, Bahasa Indonesia)

Sumber tunggal isi: `docs/superpowers/specs/2026-11-15-deadline-reminder-design.md` bagian 4.
Tampilan slide ada di `deck.html`; PDF diekspor dari file itu (`StudyTrack-Deck.pdf`).
Penanda `[ISI ...]` dan `[NAMA PESERTA ...]` diisi peserta sebelum merekam (tautan repositori, URL publik setelah deploy, hasil uji kunci Gemini, nama). Jangan diisi dengan karangan. Hasil test dan screenshot di deck berasal dari proses nyata.

---

## Slide 1. Judul

**StudyTrack: Reminder Tugas Mendekati Deadline**
Studi Kasus Video Assessment, Academya Arkavidia 11.0, Career Path Software Engineer
Perancangan teknis per layer: Database, Backend, Frontend
Nama peserta: `[NAMA PESERTA: diisi sendiri]`

---

## Slide 2. Tugas 1, P1: Perubahan

Kebutuhan F01 sampai F04 dipecah dengan tiga pertanyaan panduan:

1. **Data baru?** Tidak ada data baru yang disimpan. Kategori dan sisa waktu **dihitung** (diturunkan) dari `deadline`, `status`, dan waktu saat ini.
2. **Logika baru?** Ya. Kategorikan setiap tugas (`mendekati`, `overdue`, `normal`) dan urutkan per kelompok.
3. **Tampilan baru?** Ya. Penanda berbeda untuk mendekati dan overdue pada card tugas, plus urutan tampil yang baru.

---

## Slide 3. Tugas 1, P2: Pemetaan ke Layer

| Perubahan | Database | Backend | Frontend |
|---|---|---|---|
| Kategori dan sisa waktu diturunkan | Tidak terdampak | Terdampak | Tidak terdampak |
| Urutan per kelompok (mendekati, overdue, normal) | Tidak terdampak | Terdampak | Tidak terdampak |
| Penanda visual dan refresh | Tidak terdampak | Tidak terdampak | Terdampak |

Tabel ini hanya alat bantu (sesuai guidebook). Baris yang terdampak menjadi task di P3.

---

## Slide 4. Tugas 1, P3: Tabel Task (1 dari 2)

| No | Deskripsi Task | Layer | Ketergantungan | Catatan/Asumsi |
|---|---|---|---|---|
| 1 | Dokumentasikan keputusan **tidak** mengubah skema tugas; opsional jelaskan index `(user_id, deadline)` untuk DB sungguhan | Database | - | Kategori yang disimpan akan basi seiring waktu, jadi dihitung per request. `deadline` adalah waktu lokal tanpa zona dan diperlakukan sebagai WIB. |
| 2 | Tulis `parseDeadlineWIB(deadline)` yang mengubah `YYYY-MM-DDTHH:mm` menjadi instan absolut dengan offset tetap `+07:00` | Backend | - | Zona waktu host server tidak boleh berpengaruh. Di kode: `parseWIB`. |
| 3 | Tulis `categorizeTask(task, now)` yang mengembalikan `{kategori, sisa_menit}`: `mendekati` jika `0 < sisa < 24 jam`, `overdue` jika `sisa <= 0`, selain itu `normal`; `status` diabaikan | Backend | 2 | `now` bisa disuntikkan untuk tes. Tepat 24 jam adalah `normal`. Tepat 0 adalah `overdue` (waktu habis). Tugas selesai ikut ditandai (keputusan desain, mengikuti F01 secara harfiah). |
| 4 | Ubah `GET /api/tasks`: tambahkan `kategori` dan `sisa_menit`; urutkan mendekati (terdekat dulu), overdue (yang baru lewat dulu), normal (`created_at` terbaru dulu); kembalikan `server_time` | Backend | 3 | Memenuhi F02/F03/F04. Pengurutan di server agar sumber kebenaran tunggal. |

## Slide 5. Tugas 1, P3: Tabel Task (2 dari 2)

| No | Deskripsi Task | Layer | Ketergantungan | Catatan/Asumsi |
|---|---|---|---|---|
| 5 | Tambahkan penanda berbasis `kategori` pada `TaskCard` (normal / mendekati / overdue) dengan label teks, tidak hanya warna | Frontend | 4 | Kebenaran logika lebih diutamakan daripada kompleksitas tampilan. |
| 6 | Halaman Tugas mengambil ulang data tiap 60 detik dan saat jendela mendapat fokus | Frontend | 4 | Halaman yang dibiarkan terbuka tidak boleh menampilkan kategori basi. |
| 7 | Tambahkan unit test `categorizeTask` memakai tabel data contoh dengan `now` tetap | Backend | 3 | Kasus yang sama menjadi tabel verifikasi Tugas 3. |
| 8 | Tambahkan `POST /api/ai/prioritas` + tombol UI saran urutan belajar, dengan rantai fallback | Backend + Frontend | 4 | Bonus AI. Tidak diwajibkan oleh F01 sampai F04. |

Ketiga layer terwakili: Database (task 1), Backend (task 2, 3, 4, 7, 8), Frontend (task 5, 6, 8).

---

## Slide 6. Tugas 2, Layer A: Database

**Keputusan: skema tidak berubah.**

- Field tugas yang sudah ada: `id, judul, deskripsi, deadline, status, mata_kuliah_id, created_at, user_id`. Semuanya sudah cukup untuk fitur ini.
- Kolom `kategori` yang disimpan akan salah seiring waktu berjalan dan butuh background job untuk memperbaikinya, jadi kategori **diturunkan** saat request.
- Dengan DB sungguhan, index `(user_id, deadline)` membantu bila penyaringan dipindah ke SQL.
- `deadline` disimpan sebagai waktu lokal tanpa zona dan diperlakukan sebagai WIB.

---

## Slide 7. Tugas 2, Layer B: Backend (1 dari 2) fungsi kategori

```
WIB_OFFSET = "+07:00"
parseDeadlineWIB(s)  -> Date   // di kode: parseWIB
  // "YYYY-MM-DDTHH:mm" (tanpa detik): tambah ":00"; dengan detik: apa adanya
  // lalu tempel WIB_OFFSET; format tidak dikenal -> Invalid Date

categorizeTask(task, now):
  // status sengaja diabaikan: kategori hanya bergantung pada deadline
  remainingMs = parseDeadlineWIB(task.deadline) - now
  if remainingMs <= 0:                  overdue
  else if remainingMs < 24*3600*1000:   mendekati
  else:                                 normal
  // sisa_menit dibulatkan ke arah nol; nol atau negatif bila overdue
  sisa_menit = trunc(remainingMs / 60000)
```

Masukan: `task.deadline` (`YYYY-MM-DDTHH:mm` atau dengan detik, WIB), `now` (Date, bisa disuntikkan).
Keluaran: `{kategori, sisa_menit}`.

---

## Slide 8. Tugas 2, Layer B: Backend (2 dari 2) endpoint

```
GET /api/tasks:
  now = new Date()
  tasks = userTasks.map(add kategori, sisa_menit, mata_kuliah)
  sort by group rank (mendekati=0, overdue=1, normal=2), lalu dalam grup:
     mendekati: sisa_menit asc
     overdue:   sisa_menit desc   (paling baru lewat dulu)
     normal:    created_at desc
  respond { tasks, server_time: now.toISOString() }
```

Masukan: token login (hanya tugas milik pengguna itu, F04).
Keluaran: `{ tasks: [..., kategori, sisa_menit, mata_kuliah], server_time }`.

---

## Slide 9. Tugas 2, Layer C: Frontend

`TaskCard` membaca `task.kategori` dari respons backend. Tiga screenshot aplikasi nyata (`screenshots/normal.png`, `mendekati.png`, `overdue.png`):

- `normal` (sisa 24 jam atau lebih): card biasa, hanya badge status "Belum".
- `mendekati` (kurang dari 24 jam): tepi dan latar card disorot, badge "Mendekati Deadline", teks sisa waktu "Sisa 1 j 59 m".
- `overdue` (waktu habis): tepi dan latar merah, badge "Terlambat", teks "Terlambat 131 hr 2 j".

**Kondisi penentu tampilan:** `task.kategori` dari backend. Refresh tiap 60 detik dan saat fokus; penanda selalu memuat teks.

Sumber gambar: aplikasi nyata pada 15 Nov 2026 sekitar 02.14 WIB (`now` = jam server): data seed (semua sudah terlambat) ditambah satu tugas bertenggat sekitar 2 jam lagi dan satu tugas bertenggat 3 hari lagi.

---

## Slide 10. Tugas 3, Verifikasi (1 dari 2)

Data acuan: tabel contoh guidebook (tugas 1: 07-03 23:59, tugas 2: 07-02 10:00, tugas 3: 07-06 23:59), `now` tetap. Skenario 1 sampai 7 diuji di `backend/test/deadline.test.js`, skenario 8 di `backend/test/tasks.api.test.js`; semuanya lulus dan angka `sisa_menit` adalah nilai yang di-assert test. Bagian tampilan (penanda overdue pada skenario 3, badge Selesai pada skenario 4) dicek manual.

| No. | Kondisi / Input | Hasil yang Diharapkan | Jenis Skenario |
|---|---|---|---|
| 1 | `now = 2026-07-02 09:00` WIB; tugas 2 deadline `07-02 10:00` | Tugas 2 `mendekati`, `sisa_menit = 60`, tampil paling atas (urutan id 2, 3, 1). Test: `seed at 2026-07-02T09:00+07:00` | Positif |
| 2 | `now` sama; tugas 1 (`07-03 23:59`) dan tugas 3 (`07-06 23:59`) | Keduanya `normal`; tugas 1 `sisa_menit = 2339` (sekitar 39 jam), tugas 3 lebih jauh; urut `created_at` terbaru dulu. Test: sama dengan skenario 1 | Positif |
| 3 | `now = 2026-07-04 00:00`; tugas 1 dan tugas 2 | Keduanya `overdue` (tugas 1 `-1`, tugas 2 `-2280` menit), tetap tampil (urutan 1, 2, 3), penanda overdue bukan mendekati (dicek manual). Test: `seed at 2026-07-04T00:00+07:00` | Negatif |
| 4 | Tugas 2 dengan `status = selesai` dan `now = 2026-07-02 09:00` | Tetap `mendekati` (status tidak mengubah kategori); card juga memuat badge status "Selesai" (dicek manual). Test: `selesai is still flagged` | Edge Case |

## Slide 11. Tugas 3, Verifikasi (2 dari 2)

| No. | Kondisi / Input | Hasil yang Diharapkan | Jenis Skenario |
|---|---|---|---|
| 5 | `now = 2026-07-01 10:00`; tugas 2 (tepat 24 jam tersisa) | `normal`, `sisa_menit = 1440` (harus kurang dari 24 jam secara ketat); satu menit kemudian `mendekati`, `1439`. Test: `exactly 24h is normal` | Edge Case |
| 6 | `now = 2026-07-02 10:00`; tugas 2 (sisa tepat 0) | `overdue`, `sisa_menit = 0`. Test: `exactly 0 is overdue` | Edge Case |
| 7 | Zona waktu host server diatur ke UTC | Hasil sama dengan host WIB (juga diuji dengan `America/Los_Angeles`). Test: `host timezone irrelevant` | Edge Case |
| 8 | Tugas dekat deadline milik pengguna lain | Tidak dikembalikan (F04: hanya tugas sendiri). Test: `only returns the logged-in user's own tasks` (`tasks.api.test.js`) | Negatif |

Ringkasan jenis: Positif (1, 2), Negatif (3, 8), Edge Case (4, 5, 6, 7). Skenario 1 sampai 7 ada di `deadline.test.js`, skenario 8 di `tasks.api.test.js`.

---

## Slide 12. Tugas 3, Hasil pengujian

| Perintah | Hasil |
|---|---|
| `cd backend && npm test` | 70 test lulus, 0 gagal, 0 dilewati (8 berkas) |
| `cd frontend && npm test` | 4 test lulus, 0 gagal (format sisa waktu) |
| `npm --prefix frontend run build` | Build berhasil (Vite 8.1.0, 80 modul) |

Rincian backend: `deadline.test.js` 16, `advice.test.js` 13, `ai.api.test.js` 7, `llm.test.js` 9, `static.test.js` 7, `config.test.js` 5, `tasks.api.test.js` 8, `auth.middleware.test.js` 5. Test AI memakai provider tiruan; tidak ada pemanggilan Gemini sungguhan di dalam test.

---

## Slide 13. Ringkasan: konsistensi antar layer

| Data (Database) | Backend | Frontend |
|---|---|---|
| `deadline` | `parseDeadlineWIB` (di kode: `parseWIB`) lalu `categorizeTask` menghasilkan `kategori`, `sisa_menit` | `task.kategori`, `task.sisa_menit` memilih penanda dan teks sisa waktu |
| `status` | diabaikan oleh `categorizeTask`, diteruskan apa adanya | badge "Belum" / "Selesai" tetap tampil |
| `created_at` | urutan kelompok `normal` | tidak dihitung ulang di klien |
| `user_id` | hanya tugas pengguna yang login (F04) | menampilkan apa yang diterima |
| `mata_kuliah_id` | digabung menjadi `mata_kuliah` | nama mata kuliah di card |

Backend menjadi satu-satunya tempat kategori dan urutan dihitung. Frontend hanya menampilkan.

---

## Slide 14. Bonus

- **Kode nyata:** dibangun. Rancangan Tugas 2 direalisasikan di starter kit (backend Express, frontend React), dengan 70 test backend dan 4 test frontend yang lulus. Repositori: `[ISI: tautan repositori GitHub]`
- **AI/LLM:** dibangun dan diuji unit dengan provider tiruan. `POST /api/ai/prioritas` memakai rantai Gemini, lalu model open-source, lalu aturan. Fallback berbasis aturan sudah terverifikasi (slide 15). Pemanggilan Gemini sungguhan belum dicoba (menunggu kunci API). `[ISI setelah uji kunci: sumber gemini terkonfirmasi]`
- **Deployment:** siap deploy. Blueprint Render (satu layanan, Express menyajikan build React) dan mode production sudah diuji lokal. Belum ada URL publik. `[ISI: URL publik Render setelah deploy]` Batasan: `db.json` di free tier kembali ke seed saat redeploy atau restart.
- **Git history rapi:** branch fitur terpisah dari `main`, satu commit baseline (`5db4a7e`) lalu 14 commit deskriptif per langkah (`feat`, `fix`, `style`, `docs`).

---

## Slide 15. Bonus AI: tampilan nyata

Screenshot `screenshots/advice.png`: panel "Saran Urutan Belajar" dengan hasil saran. Tombol "Minta Saran Prioritas" memanggil `POST /api/ai/prioritas`; server memilih tugas mendekati dan terlambat milik pengguna yang login; satu panggilan per pengguna tiap 10 detik; kunci API hanya di environment variable. Keterangan "Saran otomatis (tanpa AI)" berarti sumbernya aturan bawaan, bukan keluaran model.

---

## Slide 16. Penutup

Ringkasan: kategori diturunkan di backend (tanpa ubah skema), urutan Mendekati lalu Overdue lalu Normal, penanda berlabel teks, 8 skenario verifikasi (Positif, Negatif, Edge Case).
Terima kasih.
