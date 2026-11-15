# Naskah Video: StudyTrack, Reminder Tugas Mendekati Deadline

**Sebelum merekam, isi:**
- `[NAMA PESERTA: diisi sendiri]` pada slide 1.
- `[ISI: tautan repositori GitHub]` pada slide 14 (setelah Anda push repositori).
- `[ISI: URL publik Render setelah deploy]` pada slide 14 (setelah deploy ke Render).
- `[ISI setelah uji kunci: sumber gemini terkonfirmasi]` pada slide 14: ganti dengan hasil uji nyata (mis. kartu saran menampilkan sumber Gemini) setelah Anda mengisi `GEMINI_API_KEY`. Jika tidak diuji, hapus penandanya dan biarkan kalimat "belum dicoba".
- Setelah mengubah `deck.html`, ekspor ulang PDF (perintah ada di komentar CSS paling atas `deck.html`) dan pastikan jumlah halaman tetap 16. Bila Anda menambah atau mengurangi slide, sesuaikan nomor di tabel waktu di bawah.

**Ketentuan teknis (guidebook):**
- Durasi total maksimal **15 menit**.
- Format file **MP4, MOV, atau AVI**.
- Resolusi minimal **480p**, audio jelas dan terdengar.
- **Satu rekaman sambung** (tidak perlu dipotong).
- Urutan: Perkenalan, Motivasi, Pengalaman, lalu Studi Kasus.
- Diunggah lewat akun peserta di website Academya Arkavidia.
- Media slide yang dipakai: `StudyTrack-Deck.pdf` (16 halaman; nomor di bawah merujuk ke halaman itu).

**Rencana waktu:** Bagian A 4:00 + Bagian B (studi kasus) 9:25 + penutup 1:00 = **14:25**. Margin sekitar 35 detik di bawah batas 15:00. Demo langsung aplikasi tidak dimasukkan supaya anggaran waktu tetap aman; screenshot nyata pada slide 9 dan 15 sudah menunjukkan tampilannya.

---

## Bagian A. Wawancara Motivasi (4:00, isi sendiri)

Bagian ini hanya berisi tiga poin dari guidebook. Isi dengan kata-kata Anda sendiri.

### 1. Perkenalan diri singkat
Nama, asal universitas, jurusan, dan semester saat ini.

### 2. Alasan memilih path Software Engineer di Academya Arkavidia 11.0
Alasan memilih path ini, beserta target yang ingin dicapai setelah mengikuti program.

### 3. Pengalaman relevan di bidang ini
Proyek kuliah, eksplorasi mandiri, kursus singkat, atau kegiatan organisasi.

---

## Bagian B. Studi Kasus (9:25)

Buka `StudyTrack-Deck.pdf` layar penuh dan jalankan sesuai urutan di bawah. Waktu relatif terhadap awal Bagian B.

| Waktu | Slide (halaman PDF) | Yang dibicarakan |
|---|---|---|
| 0:00-0:30 | 1. Judul | Sebut kasus: fitur Reminder Tugas Mendekati Deadline di StudyTrack. Tiga hasil yang akan ditunjukkan: tabel task (Tugas 1), rancangan per layer (Tugas 2), skenario verifikasi (Tugas 3). |
| 0:30-1:10 | 2. P1 Perubahan | Tiga pertanyaan: tidak ada data baru yang disimpan (kategori dihitung dari `deadline`), ada logika baru (kategori dan urutan), ada tampilan baru (penanda dan urutan). |
| 1:10-1:35 | 3. P2 Pemetaan | Sebut bahwa tabel ini hanya alat bantu. Database tidak terdampak, Backend terdampak untuk dua baris, Frontend untuk satu baris. |
| 1:35-3:20 | 4 dan 5. P3 Tabel task | Jalankan 8 task. Soroti: task 1 (Database, tidak ubah skema), task 3 (aturan `0 < sisa < 24 jam`, tepat 24 jam normal, tepat 0 overdue, status diabaikan), task 4 (urutan di server), task 5 dan 6 (penanda dan refresh). Sebut ketergantungan dan asumsi WIB. |
| 3:20-3:55 | 6. Layer A Database | Skema tidak berubah dan alasannya (kategori yang disimpan akan basi). Index `(user_id, deadline)` hanya untuk DB sungguhan. |
| 3:55-5:30 | 7 dan 8. Layer B Backend | Baca pseudocode `categorizeTask` (masukan `task.deadline` dan `now`, keluaran `{kategori, sisa_menit}`). Lalu `GET /api/tasks`: urutan Mendekati, Overdue, Normal, dan aturan urut dalam tiap grup. Jelaskan offset tetap `+07:00`. |
| 5:30-6:30 | 9. Layer C Frontend | Tiga screenshot card nyata (normal, mendekati, overdue). Kondisi penentu: `task.kategori` dari backend. Penanda selalu bertulisan, tidak hanya warna. Refresh tiap 60 detik dan saat fokus. Sebut bahwa gambar diambil dari aplikasi yang berjalan. |
| 6:30-7:55 | 10 dan 11. Verifikasi | Tunjuk tiga jenis: Positif (1, 2), Negatif (3, 8), Edge Case (4 sampai 7). Sebut angka nyata: 60 menit, 2339 menit, -1 dan -2280, batas 1440 menjadi normal dan 1439 mendekati, tepat 0 overdue, status selesai, host UTC. Tiap skenario punya test bernama di kolom hasil. |
| 7:55-8:20 | 12. Hasil pengujian | Sebut hasil nyata: 70 test backend dan 4 test frontend lulus, build berhasil. Test AI memakai provider tiruan. |
| 8:20-8:45 | 13. Ringkasan konsistensi | Telusuri satu field dari DB ke Backend ke Frontend, misalnya `deadline` ke `kategori` ke penanda card. Backend satu-satunya tempat kategori dihitung. |
| 8:45-9:25 | 14 dan 15. Bonus | Sebut singkat dan jujur: kode berjalan dan teruji, saran urutan belajar sudah dibangun dengan fallback aturan (tampilan di slide 15), siap deploy ke Render, git history rapi. Ucapkan status AI dan deployment sesuai isi slide setelah Anda mengisinya (jangan menyebut sudah live bila URL belum ada). |

---

## Penutup (1:00)

Slide 16. Ringkas tiga hal: kategori dihitung di backend tanpa mengubah skema, urutan Mendekati lalu Overdue lalu Normal dengan penanda berteks, dan 8 skenario verifikasi yang mencakup Positif, Negatif, dan Edge Case. Sebut terima kasih.

---

## Catatan sebelum merekam

- Semua penanda `[ISI ...]` dan `[NAMA PESERTA ...]` di atas harus sudah diganti (atau dihapus bila tidak berlaku) sebelum PDF final dipakai.
- Rekam dalam satu take. Latih sekali dengan pewaktu agar total tidak melewati 15:00.
