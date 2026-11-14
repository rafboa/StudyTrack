# StudyTrack: Reminder Tugas Mendekati Deadline (isi slide, Bahasa Indonesia)

Sumber tunggal isi: `docs/superpowers/specs/2026-11-15-deadline-reminder-design.md` bagian 4.
Tampilan slide ada di `deck.html`; PDF diekspor dari file itu (`StudyTrack-Deck.pdf`).
Teks bertanda `[PLACEHOLDER Task 8: ...]` belum tersedia dan diisi pada Task 8 (screenshot, URL publik, hasil test). Jangan diisi dengan karangan.

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
| 2 | Tulis `parseDeadlineWIB(deadline)` yang mengubah `YYYY-MM-DDTHH:mm` menjadi instan absolut dengan offset tetap `+07:00` | Backend | - | Zona waktu host server tidak boleh berpengaruh. |
| 3 | Tulis `categorizeTask(task, now)` yang mengembalikan `{kategori, sisa_menit}`: `mendekati` jika `0 < sisa < 24 jam`, `overdue` jika `sisa <= 0`, selain itu `normal`; `status` diabaikan | Backend | 2 | `now` bisa disuntikkan untuk tes. Tepat 24 jam adalah `normal`. Tepat 0 adalah `overdue` (waktu habis). Tugas selesai ikut ditandai (keputusan pengguna, mengikuti F01 secara harfiah). |
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
parseDeadlineWIB(s)  -> Date   // new Date(s + ":00" + WIB_OFFSET)

categorizeTask(task, now):
  // status sengaja diabaikan: kategori hanya bergantung pada deadline
  remainingMs = parseDeadlineWIB(task.deadline) - now
  if remainingMs <= 0:                  overdue
  else if remainingMs < 24*3600*1000:   mendekati
  else:                                 normal
  sisa_menit = floor(remainingMs / 60000)   // negatif bila overdue
```

Masukan: `task.deadline` (`YYYY-MM-DDTHH:mm`, WIB), `now` (Date, bisa disuntikkan).
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

`TaskCard` membaca `task.kategori` dari respons backend.

- `normal`: card seperti sekarang, tidak berubah.
- `mendekati`: card disorot + badge "Mendekati Deadline" dengan sisa waktu (contoh "sisa 1 j 0 m").
- `overdue`: card yang tampil berbeda + badge "Terlambat" dengan keterlambatannya.

Sketsa tiga card: normal / mendekati / overdue (lihat `deck.html`).

**Kondisi penentu tampilan:** nilai `task.kategori` (`normal` | `mendekati` | `overdue`) dari backend. Halaman mengambil ulang tiap 60 detik dan saat fokus. Penanda selalu memuat teks, tidak hanya warna.

`[PLACEHOLDER Task 8: screenshot aplikasi nyata untuk tiga kondisi card]`

---

## Slide 10. Tugas 3, Verifikasi (1 dari 2)

Data acuan: tabel contoh tugas di guidebook (tugas 1: 07-03 23:59, tugas 2: 07-02 10:00, tugas 3: 07-06 23:59), `now` tetap.

| No. | Kondisi / Input | Hasil yang Diharapkan | Jenis Skenario |
|---|---|---|---|
| 1 | `now = 2026-07-02 09:00` WIB; tugas 2 deadline `07-02 10:00` | Tugas 2 `mendekati` (sisa sekitar 60 menit) dan tampil paling atas | Positif |
| 2 | `now` sama; tugas 1 (`07-03 23:59`) dan tugas 3 (`07-06 23:59`) | Keduanya `normal` (sisa sekitar 39 jam dan lebih), urut `created_at` | Positif |
| 3 | `now = 2026-07-04 00:00`; tugas 1 dan tugas 2 | Keduanya `overdue`, tetap tampil, dengan penanda overdue, bukan penanda mendekati | Negatif |
| 4 | Tugas 2 dengan `status = selesai` dan `now = 2026-07-02 09:00` | Tetap `mendekati` (status tidak mengubah kategori); card juga menampilkan badge status "Selesai" | Edge Case |

## Slide 11. Tugas 3, Verifikasi (2 dari 2)

| No. | Kondisi / Input | Hasil yang Diharapkan | Jenis Skenario |
|---|---|---|---|
| 5 | `now = 2026-07-01 10:00`; tugas 2 (tepat 24 jam tersisa) | `normal` (harus kurang dari 24 jam secara ketat) | Edge Case |
| 6 | `now = 2026-07-02 10:00`; tugas 2 (sisa tepat 0) | `overdue` | Edge Case |
| 7 | Zona waktu host server diatur ke UTC | Hasil sama dengan host WIB | Edge Case |
| 8 | Tugas dekat deadline milik pengguna lain | Tidak dikembalikan (F04: hanya tugas sendiri) | Negatif |

Ringkasan jenis: Positif (1, 2), Negatif (3, 8), Edge Case (4, 5, 6, 7).

`[PLACEHOLDER Task 8: hasil unit test dan screenshot hasil tes yang dijalankan]`

---

## Slide 12. Konsistensi antar layer

| Data (Database) | Backend | Frontend |
|---|---|---|
| `deadline` | `parseDeadlineWIB` lalu `categorizeTask` menghasilkan `kategori`, `sisa_menit` | `task.kategori`, `task.sisa_menit` memilih penanda dan teks sisa waktu |
| `status` | diabaikan oleh `categorizeTask`, diteruskan apa adanya | badge "Belum" / "Selesai" tetap tampil |
| `created_at` | urutan kelompok `normal` | tidak dihitung ulang di klien |
| `user_id` | hanya tugas pengguna yang login (F04) | menampilkan apa yang diterima |
| `mata_kuliah_id` | digabung menjadi `mata_kuliah` | nama mata kuliah di card |

Backend menjadi satu-satunya tempat kategori dan urutan dihitung. Frontend hanya menampilkan.

---

## Slide 13. Bonus

- **Kode nyata:** rancangan Tugas 2 direalisasikan di starter kit. `[PLACEHOLDER Task 8: tautan repositori]`
- **AI/LLM:** saran urutan belajar (`POST /api/ai/prioritas`): Gemini, lalu model open-source gratis, lalu pesan berbasis aturan jika keduanya gagal. Kunci hanya di environment variable.
- **Deployment:** satu layanan Render (Express menyajikan build React), satu URL publik. `[PLACEHOLDER Task 8: URL publik]` Batasan: `db.json` di free tier kembali ke seed saat redeploy/restart.
- **Git history rapi:** branch fitur dan satu commit deskriptif per langkah.

---

## Slide 14. Penutup

Ringkasan: kategori diturunkan di backend (tanpa ubah skema), urutan Mendekati lalu Overdue lalu Normal, penanda berlabel teks, 8 skenario verifikasi (Positif, Negatif, Edge Case).
Terima kasih.
