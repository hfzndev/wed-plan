# Rencana Kita

Perencana pernikahan privat untuk dua orang — akad KUA + resepsi, tanpa Wedding Organizer.
Mobile-first, self-hosted, tanpa halaman publik dan tanpa signup.

> **Baru pertama kali setup atau mau deploy?** Lihat [TODO-MANUAL.md](TODO-MANUAL.md) — daftar
> semua langkah yang harus dikerjakan manual, untuk testing lokal maupun VPS.

## Modul

| Halaman | Isi |
|---|---|
| `/` | Hitung mundur, ringkasan budget, pembayaran jatuh tempo, task terdekat, progres dokumen |
| `/budget` | Item budget per kategori + jadwal pembayaran (DP / termin / pelunasan) |
| `/vendor` | Pipeline shortlist → survei → nego → booked, kontak, kontrak |
| `/checklist` | 64 task template 12 bulan, jatuh tempo dihitung mundur dari tanggal resepsi |
| `/dokumen` | 23 dokumen nikah jalur KUA, status tiga tingkat |
| `/rundown` | Susunan acara akad dan resepsi, terpisah |
| `/ide` | Papan ide (link IG/Pinterest) + log keputusan berdua |
| `/seserahan` | Daftar barang seserahan dan mahar |
| `/ai` | Konsultan AI — chat + tombol analisa menyeluruh, membaca seluruh data kalian |
| `/pengaturan` | Nama, tanggal, venue, target tamu, total budget, nomor WhatsApp, ganti password |

Navigasi bawah: **Budget · Vendor · [Beranda] · Konsultan · Lainnya**. Beranda di tengah sebagai
tombol menonjol. Checklist, Dokumen, Rundown, Ide, Seserahan, dan Pengaturan ada di menu Lainnya.

## Tiga hal yang perlu dipahami

**Target tamu menggerakkan biaya katering.** Item budget bertipe `per orang` tidak menyimpan
totalnya — totalnya selalu dihitung ulang dari `targetTamu` di Pengaturan. Ubah 250 jadi 300, dan
seluruh biaya katering ikut naik tanpa mengedit satu item pun.

**Modul berdiri sendiri.** Vendor dan Budget tidak saling terikat. Booking vendor tidak otomatis
membuat item budget. Yang ada hanya tombol **Salin ke Budget** di halaman vendor — membuka form
item budget dengan nama, kategori, dan harga sudah terisi. Setelah itu keduanya terpisah penuh.

**AI hanya membaca.** Konsultan tidak bisa membuat atau mengubah apa pun. Dia membaca snapshot
seluruh data lalu menjawab dengan angka kalian sendiri. Saran yang bagus tetap harus kalian catat
sendiri ke Checklist atau Budget.

## Menjalankan lokal

```bash
pnpm install
```

```bash
cp .env.example .env
```

Isi `.env`, lalu:

```bash
pnpm db:migrate && pnpm db:seed && pnpm dev
```

`NEXTAUTH_SECRET` dibuat dengan:

```bash
openssl rand -base64 32
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Server pengembangan |
| `pnpm check` | Lint + typecheck + test |
| `pnpm build` | Build produksi |
| `pnpm db:generate` | Buat file migrasi dari perubahan `src/db/schema.ts` |
| `pnpm db:migrate` | Terapkan migrasi |
| `pnpm db:seed` | Seed 2 akun + template task & dokumen (aman dijalankan ulang) |
| `pnpm icons` | Regenerate ikon PWA |

| `pnpm db:hapus-user <email>` | Hapus satu akun |

### Akun

`.env` hanya dibaca **saat seed dijalankan**, bukan saat aplikasi hidup. Jadi setiap kali mengubah
kredensial di `.env`, jalankan `pnpm db:seed` supaya perubahannya benar-benar masuk ke database.

**Lupa password?** Ubah `SEED_*_PASSWORD` di `.env`, jalankan `pnpm db:seed`. Seed memperbarui
password akun yang emailnya sudah ada, tanpa menyentuh data lain.

**Ganti email?** Seed membuat akun *baru*, bukan mengganti nama akun lama — dan akun lama tetap
bisa dipakai masuk. Karena itu seed menghitung setiap akun di database yang tidak ada di `.env` dan
memperingatkannya. Hapus yang bukan milik kalian:

```bash
pnpm db:hapus-user email-lama@contoh.id
```

## Konsultan AI

Provider apa pun yang bicara protokol OpenAI bisa dipakai — pindah provider cukup mengganti env,
tidak ada kode yang berubah.

```env
AI_BASE_URL=https://ai.sumopod.com/v1
AI_API_KEY=sk-...
AI_MODEL=deepseek-chat
```

| Mau pakai | AI_BASE_URL | AI_MODEL |
|---|---|---|
| SumoPod (default) | `https://ai.sumopod.com/v1` | `deepseek-chat`, `gemini/gemini-2.5-flash`, dll |
| DeepSeek langsung | `https://api.deepseek.com` | `deepseek-chat` atau `deepseek-reasoner` |

`AI_API_KEY` kosong → halaman `/ai` menampilkan panduan pengisian, bukan error.

**Kendali biaya.** Riwayat yang ikut dikirim dibatasi 16 pesan terakhir, snapshot data dipotong di
6.000 karakter, dan jawaban dibatasi 1.500 token. Ringkasan mingguan WhatsApp sengaja **tidak**
memanggil AI — tidak ada biaya yang jalan otomatis tanpa kalian sadari.

## Reminder WhatsApp

Butuh [WAHA](https://waha.devlike.pro) yang berjalan sendiri. `WAHA_BASE_URL` kosong = fitur mati.

```env
WAHA_BASE_URL=http://127.0.0.1:3001
WAHA_API_KEY=
WAHA_SESSION=wedplan
CRON_SECRET=hasil-openssl-rand-hex-32
```

Pakai `WAHA_SESSION` tersendiri kalau instance WAHA-nya dipakai bareng aplikasi lain — dua aplikasi
yang berebut satu sesi akan saling memutus.

Isi nomor di **Pengaturan**, lalu tekan **Kirim tes** untuk memastikan sesinya hidup sebelum
mengandalkannya.

**Apa yang dikirim:**

- *Harian* — task jatuh tempo ≤3 hari atau telat, pembayaran ≤7 hari atau telat. Kalau tidak ada
  yang perlu dilaporkan, **tidak mengirim apa pun**.
- *Mingguan* — progres checklist, budget terpakai vs sisa, dan jatuh tempo minggu depan. Ini selalu
  dikirim: laporan progres yang hanya datang saat ada masalah membuat diamnya jadi ambigu.

**Crontab di VPS:**

```bash
30 7 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/harian
```

```bash
0 19 * * 0 curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/mingguan
```

Aman dipanggil ulang: tabel `notification_log` memakai kunci `(job, tanggal, nomor)`, jadi cron yang
di-retry tidak mengirim pesan dua kali. Pengiriman **gagal** juga dicatat — sesi WAHA `webjs` bisa
putus diam-diam, dan tanpa jejak itu satu-satunya gejala adalah reminder yang berhenti datang.

```bash
sqlite3 data/wedplan.db "SELECT * FROM notification_log ORDER BY id DESC LIMIT 10"
```

## Deploy ke VPS

```bash
pnpm install --frozen-lockfile && pnpm build && pnpm db:migrate && pnpm db:seed
```

Jalankan dengan pm2 atau systemd di belakang nginx + HTTPS. Wajib:

- `NEXTAUTH_URL` diisi domain HTTPS yang sebenarnya, bukan `localhost`
- `NEXTAUTH_SECRET` berbeda dari yang dipakai di lokal
- Folder `data/` bisa ditulis oleh proses aplikasi

### Backup

Database adalah file SQLite biasa di `data/wedplan.db`, tapi berjalan dalam mode WAL —
**jangan menyalin file mentahnya** saat aplikasi hidup, hasilnya bisa rusak. Pakai `.backup`:

```bash
sqlite3 data/wedplan.db ".backup '/backup/wedplan-$(date +%F).db'"
```

Berkas kontrak vendor ada di `data/uploads/` dan perlu di-backup terpisah.

## Catatan teknis

- **Driver SQLite: `@libsql/client`, bukan `better-sqlite3`.** Formatnya tetap SQLite standar —
  `sqlite3`, drizzle-kit, dan tooling lain tetap berlaku. Alasannya: `better-sqlite3` belum punya
  binary prebuilt untuk Node 24 dan harus dikompilasi dengan Visual Studio Build Tools di Windows.
- Semua nominal disimpan sebagai **integer rupiah**, tanpa desimal.
- Tanggal disimpan sebagai teks `YYYY-MM-DD` dan diperlakukan sebagai tanggal kalender polos,
  bukan instant — hitung mundur memakai zona `Asia/Jakarta` supaya tidak meleset satu hari.
- Middleware menjaga navigasi halaman; setiap server action **tetap** memverifikasi sesi sendiri
  lewat `wajibLogin()`, karena server action bisa dipanggil langsung lewat HTTP.
- Berkas vendor disajikan lewat `/api/files/[id]` yang mengecek sesi, bukan dari folder `public`.
  Nama file di disk selalu UUID; nama asli hanya disimpan sebagai teks tampilan.
- `/api/cron/[job]` dikecualikan dari middleware sesi karena cron tidak punya cookie — route itu
  menjaga dirinya sendiri dengan `CRON_SECRET`. **`CRON_SECRET` kosong berarti endpoint menolak
  semua panggilan**, bukan terbuka untuk siapa saja.
- Perakit pesan reminder (`src/lib/pesan-reminder.ts`) dan perakit snapshot AI
  (`src/lib/konteks-wedding.ts`) sengaja dibuat fungsi murni — tanpa query, tanpa jam sistem. Isi
  pesan dan isi konteks itu bagian yang paling sulit diyakini benar lewat tes manual: kamu tidak
  akan menunggu tiga hari hanya untuk melihat apakah kata "telat" muncul.
- Chat AI memakai route handler, bukan server action — server action tidak bisa streaming, dan
  analisa menyeluruh butuh belasan detik.
