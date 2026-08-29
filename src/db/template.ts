import type { FASE } from './schema';

type Fase = (typeof FASE)[number];

export interface TemplateTask {
  judul: string;
  deskripsi?: string;
  kategori?: string;
  fase: Fase;
  /** Hari sebelum tanggal resepsi. null = tidak terikat tanggal. */
  offsetHari: number | null;
  assignee?: 'pria' | 'wanita' | 'berdua';
}

/**
 * Checklist persiapan pernikahan Indonesia (akad KUA + resepsi, tanpa WO).
 * Offset diambil dari timeline 12 bulan yang lazim dipakai vendor lokal.
 * Fase 'pra' sengaja tanpa offset — task ini justru yang menghasilkan tanggalnya.
 */
export const TEMPLATE_TASKS: TemplateTask[] = [
  // ── Sebelum tanggal ditentukan ────────────────────────────────────────────
  { judul: 'Diskusikan visi & konsep pernikahan berdua', fase: 'pra', offsetHari: null, kategori: 'konsep', deskripsi: 'Intimate atau ramai? Adat atau modern? Sepakati dulu berdua sebelum bicara ke keluarga.' },
  { judul: 'Sepakati jumlah tamu maksimum dengan kedua keluarga', fase: 'pra', offsetHari: null, kategori: 'konsep', deskripsi: 'Angka ini yang paling menentukan biaya — katering dihitung per orang.' },
  { judul: 'Tetapkan total budget dan dari mana dananya', fase: 'pra', offsetHari: null, kategori: 'budget' },
  { judul: 'Sepakati pembagian biaya antara kedua keluarga', fase: 'pra', offsetHari: null, kategori: 'budget', deskripsi: 'Bicarakan di awal. Ini sumber gesekan paling sering kalau ditunda.' },
  { judul: 'Sisihkan dana darurat 10–15% dari total budget', fase: 'pra', offsetHari: null, kategori: 'budget' },
  { judul: 'Buka rekening atau pos tabungan khusus pernikahan', fase: 'pra', offsetHari: null, kategori: 'budget' },
  { judul: 'Tentukan rentang tanggal yang mungkin', fase: 'pra', offsetHari: null, kategori: 'tanggal', deskripsi: 'Perhatikan musim hujan, bulan Ramadan, dan tanggal merah.' },
  { judul: 'Survei 3–5 venue kandidat dan catat harganya', fase: 'pra', offsetHari: null, kategori: 'venue' },
  { judul: 'Cek ketersediaan tanggal di venue pilihan', fase: 'pra', offsetHari: null, kategori: 'venue' },
  { judul: 'Kunci tanggal akad dan resepsi', fase: 'pra', offsetHari: null, kategori: 'tanggal', deskripsi: 'Begitu tanggal resepsi diisi di Pengaturan, semua task di bawah otomatis dapat jatuh tempo.' },

  // ── 12–11 bulan ───────────────────────────────────────────────────────────
  { judul: 'Bayar DP venue untuk mengunci tanggal', fase: 't12_11', offsetHari: 340, kategori: 'venue' },
  { judul: 'Buat daftar tamu kasar per pihak', fase: 't12_11', offsetHari: 335, kategori: 'tamu' },
  { judul: 'Tentukan konsep dekorasi dan palet warna', fase: 't12_11', offsetHari: 330, kategori: 'dekorasi' },

  // ── 10–9 bulan ────────────────────────────────────────────────────────────
  { judul: 'Booking MUA', fase: 't10_9', offsetHari: 300, kategori: 'mua', deskripsi: 'MUA yang ramai sering penuh 10 bulan di muka, terutama untuk akhir pekan.' },
  { judul: 'Booking fotografer', fase: 't10_9', offsetHari: 298, kategori: 'dokumentasi' },
  { judul: 'Booking videografer', fase: 't10_9', offsetHari: 295, kategori: 'dokumentasi', deskripsi: 'Sering vendor terpisah dari fotografer — cek apakah paketnya sudah termasuk.' },
  { judul: 'Shortlist vendor dekorasi dan minta penawaran', fase: 't10_9', offsetHari: 285, kategori: 'dekorasi' },
  { judul: 'Putuskan pakai WO hari-H atau full DIY', fase: 't10_9', offsetHari: 275, kategori: 'konsep' },

  // ── 8–6 bulan ─────────────────────────────────────────────────────────────
  { judul: 'Pilih vendor katering', fase: 't8_6', offsetHari: 235, kategori: 'katering', deskripsi: 'Cek dulu apakah venue mewajibkan katering dari daftar rekanannya.' },
  { judul: 'Ikut food tasting bersama orang tua', fase: 't8_6', offsetHari: 225, kategori: 'katering' },
  { judul: 'Finalisasi menu dan jumlah stall', fase: 't8_6', offsetHari: 215, kategori: 'katering' },
  { judul: 'Pilih atau jahit gaun dan jas pengantin', fase: 't8_6', offsetHari: 230, kategori: 'busana' },
  { judul: 'Tentukan seragam keluarga dan bagikan kainnya', fase: 't8_6', offsetHari: 200, kategori: 'busana', deskripsi: 'Kain perlu dibagikan jauh hari supaya keluarga sempat menjahitkan.' },
  { judul: 'Booking entertainment atau musik', fase: 't8_6', offsetHari: 190, kategori: 'hiburan' },
  { judul: 'Mulai perawatan kulit dan program kebugaran', fase: 't8_6', offsetHari: 180, kategori: 'pribadi' },

  // ── 5–3 bulan ─────────────────────────────────────────────────────────────
  { judul: 'Finalisasi konsep dekorasi dan layout venue', fase: 't5_3', offsetHari: 150, kategori: 'dekorasi' },
  { judul: 'Prewedding photoshoot', fase: 't5_3', offsetHari: 135, kategori: 'dokumentasi', deskripsi: 'Opsional — hapus kalau tidak diambil.' },
  { judul: 'Pesan cincin kawin', fase: 't5_3', offsetHari: 140, kategori: 'cincin', deskripsi: 'Cincin custom butuh 4–8 minggu pengerjaan.' },
  { judul: 'Tentukan desain dan cetak undangan', fase: 't5_3', offsetHari: 130, kategori: 'undangan' },
  { judul: 'Pesan souvenir', fase: 't5_3', offsetHari: 125, kategori: 'souvenir' },
  { judul: 'Siapkan seserahan dan mahar', fase: 't5_3', offsetHari: 120, kategori: 'seserahan' },
  { judul: 'Booking penginapan untuk tamu luar kota', fase: 't5_3', offsetHari: 110, kategori: 'transport' },
  { judul: 'Urus surat pengantar RT/RW', fase: 't5_3', offsetHari: 100, kategori: 'dokumen' },
  { judul: 'Urus formulir N1–N4 di kelurahan', fase: 't5_3', offsetHari: 95, kategori: 'dokumen', deskripsi: 'Penomoran formulir bisa berbeda antar daerah — konfirmasi ke KUA setempat.' },
  { judul: 'Daftarkan dan jadwalkan akad ke KUA', fase: 't5_3', offsetHari: 90, kategori: 'dokumen', deskripsi: 'Nikah di luar KUA atau di luar jam kerja kena PNBP. Tanyakan nominal terbarunya.' },
  { judul: 'Ikuti bimbingan pranikah', fase: 't5_3', offsetHari: 88, kategori: 'dokumen' },

  // ── 2 bulan ───────────────────────────────────────────────────────────────
  { judul: 'Finalisasi daftar tamu', fase: 't2', offsetHari: 60, kategori: 'tamu' },
  { judul: 'Sebar undangan fisik dan digital', fase: 't2', offsetHari: 55, kategori: 'undangan' },
  { judul: 'Fitting gaun dan jas pertama', fase: 't2', offsetHari: 50, kategori: 'busana' },
  { judul: 'Trial makeup dan hairdo', fase: 't2', offsetHari: 48, kategori: 'mua' },
  { judul: 'Susun rundown akad dan resepsi', fase: 't2', offsetHari: 45, kategori: 'rundown' },
  { judul: 'Tentukan MC dan susunan acara', fase: 't2', offsetHari: 45, kategori: 'rundown' },

  // ── 1 bulan ───────────────────────────────────────────────────────────────
  { judul: 'Technical meeting dengan semua vendor', fase: 't1', offsetHari: 30, kategori: 'vendor', deskripsi: 'Kunci rundown, titik loading, jam masuk vendor, dan siapa PIC tiap pos.' },
  { judul: 'Konfirmasi jumlah tamu final ke katering', fase: 't1', offsetHari: 25, kategori: 'katering' },
  { judul: 'Bayar termin atau pelunasan vendor sesuai kontrak', fase: 't1', offsetHari: 21, kategori: 'budget' },
  { judul: 'Fitting terakhir busana', fase: 't1', offsetHari: 20, kategori: 'busana' },
  { judul: 'Siapkan buku tamu, kotak angpao, gembok dan kuncinya', fase: 't1', offsetHari: 18, kategori: 'hariH' },
  { judul: 'Tentukan PIC tiap pos', fase: 't1', offsetHari: 18, kategori: 'hariH', deskripsi: 'Penerima tamu, penjaga kotak angpao, pemegang cincin dan mahar, penghubung vendor.' },
  { judul: 'Siapkan amplop tip dan sisa fee vendor', fase: 't1', offsetHari: 16, kategori: 'budget' },
  { judul: 'Sebarkan rundown final ke keluarga dan vendor', fase: 't1', offsetHari: 14, kategori: 'rundown' },

  // ── 7 hari terakhir ───────────────────────────────────────────────────────
  { judul: 'Konfirmasi terakhir ke semua vendor', fase: 't7hari', offsetHari: 7, kategori: 'vendor' },
  { judul: 'Siapkan tas hari-H', fase: 't7hari', offsetHari: 5, kategori: 'hariH', deskripsi: 'Dokumen, cincin, mahar, obat pribadi, jarum & benang, powerbank.' },
  { judul: 'Perawatan tubuh dan spa', fase: 't7hari', offsetHari: 4, kategori: 'pribadi' },
  { judul: 'Gladi bersih dan briefing keluarga', fase: 't7hari', offsetHari: 2, kategori: 'rundown' },
  { judul: 'Istirahat cukup, hindari makanan berisiko', fase: 't7hari', offsetHari: 1, kategori: 'pribadi' },

  // ── Hari H ────────────────────────────────────────────────────────────────
  { judul: 'Serahkan cincin dan mahar ke penanggung jawab', fase: 'hariH', offsetHari: 0, kategori: 'hariH' },
  { judul: 'Pastikan kotak angpao terkunci dan ada penjaganya', fase: 'hariH', offsetHari: 0, kategori: 'hariH' },
  { judul: 'Bayar sisa fee vendor di lokasi', fase: 'hariH', offsetHari: 0, kategori: 'budget' },

  // ── Setelah acara ─────────────────────────────────────────────────────────
  { judul: 'Rekap isi kotak angpao dan catat pemberinya', fase: 'pasca', offsetHari: null, kategori: 'pasca' },
  { judul: 'Kirim ucapan terima kasih ke tamu dan vendor', fase: 'pasca', offsetHari: null, kategori: 'pasca' },
  { judul: 'Ambil hasil foto dan video dari vendor', fase: 'pasca', offsetHari: null, kategori: 'dokumentasi' },
  { judul: 'Urus buku nikah dan pencatatan di Dukcapil', fase: 'pasca', offsetHari: null, kategori: 'dokumen' },
  { judul: 'Kembalikan barang sewaan', fase: 'pasca', offsetHari: null, kategori: 'pasca' },
  { judul: 'Rekap budget aktual vs rencana', fase: 'pasca', offsetHari: null, kategori: 'budget' },
];

export interface TemplateDokumen {
  nama: string;
  pihak: 'pria' | 'wanita' | 'berdua';
  instansi?: string;
  catatan?: string;
}

/**
 * Dokumen nikah jalur KUA.
 *
 * Penomoran formulir N berbeda-beda antar daerah dan sempat berubah aturannya,
 * jadi daftar ini adalah titik awal — konfirmasi ulang ke KUA kecamatan masing-masing.
 */
export const TEMPLATE_DOKUMEN: TemplateDokumen[] = [
  { nama: 'Fotokopi KTP', pihak: 'pria', instansi: '—' },
  { nama: 'Fotokopi Kartu Keluarga', pihak: 'pria', instansi: '—' },
  { nama: 'Fotokopi Akta Kelahiran', pihak: 'pria', instansi: '—' },
  { nama: 'Pas foto latar biru 2×3 dan 4×6', pihak: 'pria', instansi: '—', catatan: 'Biasanya masing-masing 4 lembar.' },
  { nama: 'Surat pengantar RT/RW', pihak: 'pria', instansi: 'RT/RW' },
  { nama: 'N1 — Surat Pengantar Nikah', pihak: 'pria', instansi: 'Kelurahan/Desa' },
  { nama: 'N2 — Surat Permohonan Kehendak Nikah', pihak: 'pria', instansi: 'Kelurahan/Desa' },
  { nama: 'N4 — Surat Persetujuan Mempelai', pihak: 'pria', instansi: 'Kelurahan/Desa' },
  { nama: 'Surat izin atasan', pihak: 'pria', instansi: 'Kesatuan', catatan: 'Hanya untuk TNI/Polri.' },

  { nama: 'Fotokopi KTP', pihak: 'wanita', instansi: '—' },
  { nama: 'Fotokopi Kartu Keluarga', pihak: 'wanita', instansi: '—' },
  { nama: 'Fotokopi Akta Kelahiran', pihak: 'wanita', instansi: '—' },
  { nama: 'Pas foto latar biru 2×3 dan 4×6', pihak: 'wanita', instansi: '—' },
  { nama: 'Surat pengantar RT/RW', pihak: 'wanita', instansi: 'RT/RW' },
  { nama: 'N1 — Surat Pengantar Nikah', pihak: 'wanita', instansi: 'Kelurahan/Desa' },
  { nama: 'N2 — Surat Permohonan Kehendak Nikah', pihak: 'wanita', instansi: 'Kelurahan/Desa' },
  { nama: 'N4 — Surat Persetujuan Mempelai', pihak: 'wanita', instansi: 'Kelurahan/Desa' },
  { nama: 'N5 — Surat Izin Orang Tua', pihak: 'wanita', instansi: 'Kelurahan/Desa', catatan: 'Bila mempelai berusia di bawah 21 tahun.' },

  { nama: 'Sertifikat bimbingan pranikah', pihak: 'berdua', instansi: 'KUA' },
  { nama: 'Surat rekomendasi nikah antar kecamatan', pihak: 'berdua', instansi: 'KUA asal', catatan: 'Bila akad digelar di luar kecamatan domisili.' },
  { nama: 'Bukti bayar PNBP nikah', pihak: 'berdua', instansi: 'Bank', catatan: 'Berlaku bila akad di luar KUA atau di luar jam kerja. Konfirmasi nominal terbaru.' },
  { nama: 'Hasil tes kesehatan dan imunisasi TT', pihak: 'berdua', instansi: 'Puskesmas', catatan: 'Diwajibkan di sebagian daerah saja.' },
  { nama: 'Akta cerai atau akta kematian pasangan terdahulu', pihak: 'berdua', instansi: 'Pengadilan/Dukcapil', catatan: 'Hanya bila pernah menikah.' },
];
