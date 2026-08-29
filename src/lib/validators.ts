import { z } from 'zod';
import { KATEGORI_BUDGET, KATEGORI_SESERAHAN, STATUS_VENDOR, FASE } from '@/db/schema';
import { parseRupiah } from './money';
import { parseTanggal } from './timeline';

/** Input uang datang sebagai teks berformat ("12.500.000"), bukan number. */
export const uang = z
  .string()
  .transform(parseRupiah)
  .pipe(z.number().int().min(0, 'Tidak boleh negatif'));

export const uangOpsional = z
  .string()
  .transform((v) => (v.trim() === '' ? null : parseRupiah(v)))
  .pipe(z.number().int().min(0, 'Tidak boleh negatif').nullable());

export const tanggal = z.string().refine((v) => parseTanggal(v) !== null, 'Tanggal tidak valid');

export const tanggalOpsional = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v))
  .refine((v) => v === null || parseTanggal(v) !== null, 'Tanggal tidak valid');

const teks = (maks = 200) => z.string().trim().max(maks);
const teksWajib = (label: string, maks = 200) =>
  z.string().trim().min(1, `${label} wajib diisi`).max(maks);

/**
 * Pengaturan dipecah mengikuti halamannya, bukan mengikuti tabelnya.
 *
 * Nama dan tanggal diisi sekali lalu jarang disentuh; target tamu dan budget
 * justru disesuaikan berkali-kali selama persiapan. Menyatukan keduanya berarti
 * setiap penyesuaian anggaran harus melewati enam field yang tidak berubah.
 */
export const skemaAcara = z.object({
  namaPria: teks(80),
  namaWanita: teks(80),
  tanggalAkad: tanggalOpsional,
  tanggalResepsi: tanggalOpsional,
  venueAkad: teks(160),
  venueResepsi: teks(160),
});

export const skemaAnggaran = z.object({
  targetTamu: z.string().transform((v) => parseRupiah(v)).pipe(z.number().int().min(0).max(100_000)),
  totalBudget: uang,
});

export const skemaBudgetItem = z.object({
  nama: teksWajib('Nama item'),
  kategori: z.enum(KATEGORI_BUDGET),
  tipe: z.enum(['lumpsum', 'per_pax']),
  hargaSatuan: uang,
  // Input qty di-disable saat tipe per_pax, dan input disabled tidak ikut
  // terkirim — jadi field ini harus boleh hilang.
  qty: z
    .string()
    .optional()
    .transform((v) => parseRupiah(v ?? '') || 1)
    .pipe(z.number().int().min(1).max(100_000)),
  aktual: uangOpsional,
  vendorNama: teks(120),
  catatan: teks(1000),
});

export const skemaPembayaran = z.object({
  budgetItemId: z.coerce.number().int().positive(),
  jenis: z.enum(['dp', 'termin', 'pelunasan']),
  jumlah: uang,
  jatuhTempo: tanggal,
  status: z.enum(['belum', 'lunas']),
  metode: teks(60),
  catatan: teks(500),
});

export const skemaVendor = z.object({
  nama: teksWajib('Nama vendor'),
  kategori: z.enum(KATEGORI_BUDGET),
  status: z.enum(STATUS_VENDOR),
  kontakNama: teks(80),
  whatsapp: teks(30),
  instagram: teks(80),
  website: teks(200),
  lokasi: teks(120),
  hargaPenawaran: uang,
  rating: z
    .string()
    .transform((v) => (v.trim() === '' ? null : Number(v)))
    .pipe(z.number().int().min(1).max(5).nullable()),
  catatan: teks(2000),
});

export const skemaTask = z.object({
  judul: teksWajib('Judul task'),
  deskripsi: teks(1000),
  kategori: teks(40),
  fase: z.enum(FASE),
  dueDateOverride: tanggalOpsional,
  assignee: z.enum(['pria', 'wanita', 'berdua']),
});

export const skemaDokumen = z.object({
  nama: teksWajib('Nama dokumen'),
  pihak: z.enum(['pria', 'wanita', 'berdua']),
  status: z.enum(['belum', 'proses', 'selesai']),
  instansi: teks(120),
  deadline: tanggalOpsional,
  catatan: teks(1000),
});

const jam = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:MM');

export const skemaRundown = z.object({
  acara: z.enum(['akad', 'resepsi']),
  waktuMulai: jam,
  waktuSelesai: z.union([jam, z.literal('')]),
  kegiatan: teksWajib('Kegiatan'),
  pic: teks(80),
  catatan: teks(500),
});

export const skemaIde = z.object({
  judul: teksWajib('Judul'),
  url: z.union([z.string().trim().url('URL tidak valid'), z.literal('')]),
  kategori: teks(40),
  catatan: teks(1000),
});

export const skemaKeputusan = z.object({
  topik: teksWajib('Topik'),
  keputusan: teksWajib('Keputusan', 1000),
  alasan: teks(1000),
  tanggal: tanggal,
  oleh: z.enum(['pria', 'wanita', 'berdua']),
});

export const skemaSeserahan = z.object({
  nama: teksWajib('Nama barang'),
  kategori: z.enum(KATEGORI_SESERAHAN),
  // Checkbox yang tidak dicentang tidak ikut terkirim.
  isMahar: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === 'on'),
  estimasi: uang,
  aktual: uangOpsional,
  status: z.enum(['belum', 'dibeli']),
  catatan: teks(500),
});

export type HasilAksi = { ok: true } | { ok: false; pesan: string };

/** Mengubah ZodError jadi satu kalimat yang bisa ditampilkan di form. */
export function pesanError(error: z.ZodError): string {
  const pertama = error.issues[0];
  if (!pertama) return 'Data tidak valid.';
  const field = pertama.path.join('.');
  return field ? `${field}: ${pertama.message}` : pertama.message;
}
