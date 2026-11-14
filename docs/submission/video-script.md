# Naskah Video: StudyTrack, Reminder Tugas Mendekati Deadline

**Ketentuan teknis (guidebook):**
- Durasi total maksimal **15 menit**.
- Format file **MP4, MOV, atau AVI**.
- Resolusi minimal **480p**, audio jelas dan terdengar.
- **Satu rekaman sambung** (tidak perlu dipotong).
- Urutan: Perkenalan, Motivasi, Pengalaman, lalu Studi Kasus.
- Diunggah lewat akun peserta di website Academya Arkavidia.
- Media slide yang dipakai: `StudyTrack-Deck.pdf` (14 halaman; nomor di bawah merujuk ke halaman itu).

Perkiraan waktu: Bagian A sekitar 4 menit, Bagian B (studi kasus) sekitar 10 menit, penutup sekitar 1 menit. Total sekitar 15 menit, sisakan margin beberapa detik di bawah 15:00.

---

## Bagian A. Wawancara Motivasi (sekitar 4 menit, isi sendiri)

Bagian ini hanya berisi tiga poin dari guidebook. Isi dengan kata-kata Anda sendiri.

### 1. Perkenalan diri singkat
Nama, asal universitas, jurusan, dan semester saat ini.

### 2. Alasan memilih path Software Engineer di Academya Arkavidia 11.0
Alasan memilih path ini, beserta target yang ingin dicapai setelah mengikuti program.

### 3. Pengalaman relevan di bidang ini
Proyek kuliah, eksplorasi mandiri, kursus singkat, atau kegiatan organisasi.

---

## Bagian B. Studi Kasus (sekitar 10 menit)

Buka `StudyTrack-Deck.pdf` layar penuh dan jalankan sesuai urutan di bawah.

| Waktu | Slide (halaman PDF) | Yang dibicarakan |
|---|---|---|
| 0:00-0:30 | 1. Judul | Sebut kasus: fitur Reminder Tugas Mendekati Deadline di StudyTrack. Tiga hasil yang akan ditunjukkan: tabel task (Tugas 1), rancangan per layer (Tugas 2), skenario verifikasi (Tugas 3). |
| 0:30-1:15 | 2. P1 Perubahan | Tiga pertanyaan: tidak ada data baru yang disimpan (kategori dihitung dari `deadline`), ada logika baru (kategori dan urutan), ada tampilan baru (penanda dan urutan). |
| 1:15-1:45 | 3. P2 Pemetaan | Sebut bahwa tabel ini hanya alat bantu. Database tidak terdampak, Backend terdampak untuk dua baris, Frontend untuk satu baris. |
| 1:45-3:45 | 4 dan 5. P3 Tabel task | Jalankan 8 task. Soroti: task 1 (Database, tidak ubah skema), task 3 (aturan `0 < sisa < 24 jam`, tepat 24 jam normal, tepat 0 overdue, status diabaikan), task 4 (urutan di server), task 5 dan 6 (penanda dan refresh). Sebut ketergantungan dan asumsi WIB. |
| 3:45-4:30 | 6. Layer A Database | Skema tidak berubah dan alasannya (kategori yang disimpan akan basi). Index `(user_id, deadline)` hanya untuk DB sungguhan. |
| 4:30-6:15 | 7 dan 8. Layer B Backend | Baca pseudocode `categorizeTask` (masukan `task.deadline` dan `now`, keluaran `{kategori, sisa_menit}`). Lalu `GET /api/tasks`: urutan Mendekati, Overdue, Normal, dan aturan urut dalam tiap grup. Jelaskan offset tetap `+07:00`. |
| 6:15-7:15 | 9. Layer C Frontend | Tiga sketsa card (normal, mendekati, overdue). Kondisi penentu: `task.kategori` dari backend. Penanda selalu bertulisan, tidak hanya warna. Refresh tiap 60 detik dan saat fokus. |
| 7:15-8:45 | 10 dan 11. Verifikasi | Tunjuk tiga jenis: Positif (1, 2), Negatif (3, 8), Edge Case (4 sampai 7). Tekankan batas 24 jam dan 0, status selesai, dan host UTC. |
| 8:45-9:30 | 12. Konsistensi | Telusuri satu field dari DB ke Backend ke Frontend, misalnya `deadline` ke `kategori` ke penanda card. Backend satu-satunya tempat kategori dihitung. |
| 9:30-10:00 | 13. Bonus | Sebut singkat: kode berjalan, fitur AI saran urutan belajar, deployment publik, git history rapi. (Sebut hanya yang benar-benar sudah selesai saat merekam.) |

---

## Penutup (sekitar 1 menit)

Slide 14. Ringkas tiga hal: kategori dihitung di backend tanpa mengubah skema, urutan Mendekati lalu Overdue lalu Normal dengan penanda berteks, dan 8 skenario verifikasi yang mencakup Positif, Negatif, dan Edge Case. Sebut terima kasih.

---

## Catatan sebelum merekam

- Slide yang masih memuat `[PLACEHOLDER Task 8: ...]` harus sudah terisi (screenshot, URL, hasil test) sebelum PDF final dipakai.
- Rekam dalam satu take. Latih sekali dengan pewaktu agar total tidak melewati 15:00.
