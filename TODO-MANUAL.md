# Daftar Kerja Manual

Hal-hal yang **hanya bisa kamu lakukan sendiri** — karena butuh kredensial, akses VPS, atau HP di
tanganmu. Semua yang bisa diotomatiskan sudah jadi kode; yang tersisa ada di sini.

Centang sambil jalan. Bagian A dulu di laptop, baru B dan C di VPS.

---

## A. Testing lokal (di laptop ini)

### A1. Yang sudah terbukti, tidak perlu diulang

Ini sudah diuji end-to-end dengan server tiruan — lewati saja:

- [x] Login, semua 10 halaman render tanpa error
- [x] Budget per-pax ikut berubah saat target tamu diubah
- [x] Cron: token salah → 401, job asing → 404, dedup tidak kirim dua kali
- [x] WAHA: normalisasi nomor → `@c.us`, session, header API key
- [x] AI: streaming jalan, snapshot data nyata sampai ke model, error 401 tampil sebagai kalimat
- [x] Ponsel: bottom nav dengan Beranda menonjol di tengah, konten tidak tertimpa
- [x] Desktop: sidebar muncul di ≥768px, bottom nav mati, tanpa overflow di 375/768/1024/1440
- [x] Kanban: 10 kolom cocok dengan database, drag dan tombol ‹ › sama-sama memindahkan kartu,
      tanggal ikut berubah, dan perpindahannya benar-benar tersimpan

### A2. Uji AI dengan provider sungguhan

Yang belum terbukti: apakah **model sungguhan** menjawab dengan baik. Yang sudah terbukti hanya
bahwa datanya sampai.

- [ ] Ambil API key di `ai.sumopod.com` → tab **AI** → **API Keys** → **Create key**
- [ ] Isi di `.env`:
      ```
      AI_API_KEY=sk-...
      ```
- [ ] Restart dev server (env hanya dibaca saat start)
- [ ] Buka `/ai`, tanya: **"Berapa persen budget kami sudah terpakai?"**
- [ ] **Cocokkan jawabannya dengan halaman `/budget`.** Kalau angkanya beda, ada yang salah —
      laporkan ke saya, jangan dipakai.
- [ ] Tekan **Analisa persiapan kami**. Karena budget dan vendor kalian masih kosong, jawaban yang
      benar adalah dia **mengakui datanya kosong**. Kalau dia malah mengarang analisa meyakinkan,
      berarti model itu tidak cocok — ganti `AI_MODEL`.
- [ ] Coba model lain kalau kurang puas: ganti `AI_MODEL` saja, tidak ada kode yang berubah

### A3. Uji reminder harian (butuh akal-akalan)

Resepsi kalian **12 Feb 2028 — 533 hari lagi**. Ambang digest harian cuma 3 hari, jadi sampai
sekitar **Maret 2027 tidak akan ada pesan harian sama sekali**. Itu benar, bukan bug. Untuk
mengujinya sekarang harus dipancing:

- [ ] Arahkan `WAHA_BASE_URL` ke WAHA VPS-mu (atau tunggu sampai deploy)
- [ ] Isi nomormu di **Pengaturan** → **Simpan nomor** → **Kirim tes** → pastikan masuk ke HP
- [ ] Buat pancingan: `/budget` → tambah item apa saja → buka itemnya → **Tambah pembayaran**
      dengan jatuh tempo **besok**
- [ ] Jalankan:
      ```bash
      curl -H "Authorization: Bearer rahasia-dev-lokal-abc123" http://localhost:3000/api/cron/harian
      ```
- [ ] Pastikan pesan masuk ke HP dan isinya benar
- [ ] Jalankan lagi perintah yang sama → harus `"terkirim":[]` dan `"dilewati":[...]`
- [ ] **Hapus item budget pancingan itu** setelah selesai

### A4. Bereskan sisa data uji saya

Ada yang saya buat waktu verifikasi dan belum kamu hapus:

- [ ] `/rundown` → 2 baris: "Make up pengantin" 06:00 dan "Akad nikah" 08:00 — pakai atau hapus
- [ ] `/seserahan` → 2 barang: "Seperangkat alat salat" dan "Emas 10 gram" — pakai atau hapus
- [ ] Cek `/pengaturan`: **tanggal akad dan resepsi kalian sama-sama 12 Feb 2028**. Kalau akadnya
      memang beda hari, perbaiki — semua jatuh tempo checklist dihitung dari tanggal resepsi

Kalau mau mulai benar-benar dari nol:

```bash
rm data/wedplan.db && pnpm db:migrate && pnpm db:seed
```

### A5. Nilai sendiri tampilan desktop dan papan kanban

Ini bagian yang tidak bisa saya putuskan untukmu — soal rasa memakai, bukan benar atau salah.

- [ ] Buka di monitor kamu yang sebenarnya. Sidebar kiri terasa pas, atau terlalu makan tempat?
- [ ] `/checklist` di layar lebar → papan kanban muncul. Coba **seret satu kartu** ke kolom lain
- [ ] **Perhatikan tanggalnya berubah.** Menyeret kartu bukan tindakan kosmetik — task yang tadinya
      150 hari sebelum hari-H dipindah ke fase 5–3 bulan akan jadi 120 hari, bukan kembali ke 150
- [ ] Kalau kamu butuh tanggal yang persis, isi **"jatuh tempo sendiri"** di halaman ubah task.
      Kartu yang tanggalnya dikunci diberi ikon gembok di papan, dan tidak ikut bergeser
- [ ] Coba tombol ‹ › juga — itu jalan yang sama, bisa dipakai lewat keyboard
- [ ] Di HP papan **sengaja tidak muncul**; daftar tetap seperti biasa. Kalau kamu justru ingin
      papan di HP juga, bilang — tapi mencentang task jadi butuh lebih banyak gerakan

---

## B. Setup VPS

### B1. Siapkan server

- [ ] Node.js **22 atau lebih baru** (`node -v`)
- [ ] pnpm (`npm i -g pnpm`)
- [ ] Salin project ke VPS (git clone atau rsync)
- [ ] `pnpm install --frozen-lockfile`

### B2. Buat `.env` produksi

Jangan menyalin `.env` lokal apa adanya. Yang **wajib berbeda**:

- [ ] `NEXTAUTH_URL` → domain HTTPS sungguhan, bukan `localhost`. Salah isi = login gagal terus
- [ ] `NEXTAUTH_SECRET` → **baru**, jangan sama dengan lokal:
      ```bash
      openssl rand -base64 32
      ```
- [ ] `CRON_SECRET` → **baru**, jangan pakai `rahasia-dev-lokal-abc123`:
      ```bash
      openssl rand -hex 32
      ```
- [ ] `SEED_PRIA_PASSWORD` dan `SEED_WANITA_PASSWORD` → password sungguhan, bukan `admin123`
- [ ] `WAHA_BASE_URL`, `WAHA_API_KEY` → arahkan ke WAHA VPS-mu
- [ ] `WAHA_SESSION=wedplan` → **jangan** pakai session yang sama dengan Sensasi. Dua aplikasi yang
      berebut satu sesi akan saling memutus
- [ ] `AI_API_KEY` → key SumoPod
- [ ] `DATABASE_PATH` dan `UPLOAD_DIR` → path absolut kalau menaruh `data/` di luar folder aplikasi

> **Perubahan tampilan desktop dan papan kanban tidak menambah apa pun di sini** — tanpa env var
> baru, tanpa migrasi baru, tanpa dependensi baru. Kalau kamu sudah pernah deploy, cukup tarik
> kode terbaru lalu `pnpm build` dan restart.

### B3. Build dan siapkan database

- [ ] `pnpm build`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
- [ ] Pastikan folder `data/` dan `data/uploads/` bisa **ditulis** oleh user yang menjalankan app
- [ ] Kalau seed memunculkan **PERHATIAN akun tidak ada di .env**, hapus akun asingnya:
      ```bash
      pnpm db:hapus-user email-yang-tidak-dikenal@contoh.id
      ```

### B4. Jalankan sebagai layanan

- [ ] pm2 atau systemd, jalankan `pnpm start` (bukan `pnpm dev`)
- [ ] Set auto-restart saat VPS reboot
- [ ] nginx reverse proxy ke port aplikasi
- [ ] HTTPS (Let's Encrypt). **Wajib** — tanpa ini cookie sesi dikirim polos
- [ ] Di config nginx, pastikan `proxy_buffering off` untuk `/api/ai/chat`, kalau tidak jawaban AI
      baru muncul sekaligus di akhir, bukan mengalir

### B5. WAHA

- [ ] Pastikan WAHA jalan dan session `wedplan` sudah **scan QR** dari HP yang akan jadi pengirim
- [ ] Kalau WAHA dan aplikasi beda container: `127.0.0.1` dari dalam container aplikasi menunjuk ke
      dirinya sendiri, bukan ke WAHA. Pakai nama service compose, atau `host.docker.internal`
      dengan `extra_hosts: host-gateway`

### B6. Crontab

- [ ] Pasang dua baris ini (`crontab -e`), ganti `$CRON_SECRET` dan `domain`:

```bash
30 7 * * * curl -fsS -H "Authorization: Bearer GANTI_DENGAN_CRON_SECRET" https://domain/api/cron/harian
```

```bash
0 19 * * 0 curl -fsS -H "Authorization: Bearer GANTI_DENGAN_CRON_SECRET" https://domain/api/cron/mingguan
```

- [ ] Pastikan timezone VPS = `Asia/Jakarta` (`timedatectl`), kalau tidak jamnya meleset

### B7. Backup

- [ ] Pasang cron backup harian. **Jangan copy file `.db` mentah** — mode WAL bikin hasilnya bisa
      rusak:

```bash
0 2 * * * sqlite3 /path/data/wedplan.db ".backup '/backup/wedplan-$(date +\%F).db'"
```

- [ ] Backup folder `data/uploads/` juga (kontrak vendor ada di situ, tidak ikut file `.db`)
- [ ] **Uji restore-nya sekali.** Backup yang belum pernah dicoba bukan backup

---

## C. Verifikasi setelah deploy

Jalankan berurutan. Kalau ada yang gagal, jangan lanjut.

- [ ] Buka domain di HP → diarahkan ke `/login`
- [ ] Login dengan password produksi → masuk ke Beranda
- [ ] Coba akses `https://domain/budget` di browser mode penyamaran → harus lempar ke `/login`
- [ ] **Add to Home Screen** di HP kalian berdua → ikonnya muncul, dibuka tanpa address bar
- [ ] `/pengaturan` → isi nomor → **Kirim tes** → pesan masuk ke HP **kalian berdua**
- [ ] `/ai` → tanya sesuatu → jawaban **mengalir bertahap**, bukan muncul sekaligus di akhir
      (kalau sekaligus, `proxy_buffering` nginx belum dimatikan)
- [ ] Token cron salah harus ditolak:
      ```bash
      curl -i -H "Authorization: Bearer salah" https://domain/api/cron/harian
      ```
      → harus **401**
- [ ] Token benar:
      ```bash
      curl -H "Authorization: Bearer CRON_SECRET_ASLI" https://domain/api/cron/mingguan
      ```
      → pesan ringkasan masuk ke HP
- [ ] Upload satu file di vendor → logout → buka `https://domain/api/files/1` → **harus ditolak**
- [ ] Buka domain di laptop → sidebar kiri muncul, bottom nav hilang
- [ ] `/checklist` di laptop → papan kanban muncul, seret satu kartu, **muat ulang halaman** →
      kartu tetap di kolom barunya. Kalau kembali ke tempat semula, penyimpanannya gagal
- [ ] Buka domain di HP → papan tidak muncul, daftar dan bottom nav seperti biasa

---

## D. Perawatan rutin

- [ ] **Tiap bulan:** cek apakah sesi WAHA masih hidup. Engine `webjs` pakai sesi browser sungguhan
      yang bisa putus dan butuh scan QR ulang. **Tidak ada fallback** di aplikasi ini — kalau sesi
      mati, reminder berhenti tanpa pemberitahuan
- [ ] Kalau reminder terasa berhenti datang, periksa jejaknya:
      ```bash
      sqlite3 data/wedplan.db "SELECT * FROM notification_log ORDER BY id DESC LIMIT 10"
      ```
      Kolom `status` dan `error` menyimpan sebabnya
- [ ] Pantau tagihan SumoPod. Chat AI dibatasi (16 pesan riwayat, snapshot 6.000 karakter, jawaban
      1.500 token) dan ringkasan mingguan **tidak** memanggil AI — tapi tetap ada biayanya
- [ ] **Mulai Maret 2027** digest harian baru aktif dengan sendirinya (saat task 12-bulan mulai
      masuk ambang 3 hari). Sebelum itu wajar kalau sepi

---

## Lampiran

### Kredensial lokal (laptop ini)

| | |
|---|---|
| URL | `http://localhost:3000` |
| Akun | `hafiz@mail.id` / `vira@mail.id` |
| Password | `admin123` |
| CRON_SECRET | `rahasia-dev-lokal-abc123` |

**Hanya untuk lokal.** Jangan dipakai di VPS.

### Kondisi data lokal saat ini

| Isi | Jumlah |
|---|---|
| Akun | 2 |
| Task checklist | 64 (0 selesai) |
| Dokumen KUA | 23 (0 selesai) |
| Rundown | 2 — *sisa uji saya* |
| Seserahan | 2 — *sisa uji saya* |
| Item budget, pembayaran, vendor, ide, keputusan | 0 |
| Riwayat chat AI, log notifikasi | 0 |
| Nomor WhatsApp | belum diisi |

Pengaturan: **Hafiz Norman & Vira Mawardha Putri**, akad & resepsi **12 Feb 2028**, target **150
tamu**, budget **Rp 100.000.000**.

Sebaran task per fase — dipakai kalau mau mencocokkan jumlah kolom di papan kanban:

| Fase | Task | Fase | Task |
|---|---|---|---|
| Sebelum tanggal ditentukan | 10 | 2 bulan sebelum | 6 |
| 12–11 bulan sebelum | 3 | 1 bulan sebelum | 8 |
| 10–9 bulan sebelum | 5 | 7 hari terakhir | 5 |
| 8–6 bulan sebelum | 7 | Hari H | 3 |
| 5–3 bulan sebelum | 11 | Setelah acara | 6 |

### Kalau lupa password

Ubah `SEED_*_PASSWORD` di `.env`, lalu:

```bash
pnpm db:seed
```

Seed memperbarui password akun yang emailnya sudah ada. Kalau kamu mengganti **email**-nya, seed
membuat akun baru dan akun lama tetap bisa dipakai masuk — seed akan memperingatkanmu, hapus dengan
`pnpm db:hapus-user`.

### Perintah yang sering dipakai

```bash
pnpm check
```

```bash
pnpm dev
```

```bash
pnpm db:migrate && pnpm db:seed
```
