import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch())`;

/** Akun login. Tidak ada signup — dua baris ini di-seed manual. */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  nama: text('nama').notNull(),
  peran: text('peran', { enum: ['pria', 'wanita'] }).notNull(),
  passwordHash: text('password_hash').notNull(),
  /** E.164, misalnya +628123456789. Kosong berarti tidak dikirimi reminder. */
  whatsapp: text('whatsapp').notNull().default(''),
  waAktif: integer('wa_aktif', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().default(now),
});

/**
 * Satu utas percakapan bersama, bukan per orang — pertanyaan pasangan tentang
 * pernikahan yang sama layak dibaca dua-duanya. `oleh` menandai penanyanya.
 */
export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  peran: text('peran', { enum: ['user', 'asisten'] }).notNull(),
  oleh: text('oleh', { enum: ['pria', 'wanita'] }),
  isi: text('isi').notNull(),
  createdAt: integer('created_at').notNull().default(now),
});

/**
 * Mencegah kirim ganda saat cron di-retry atau jalan dua kali.
 * `kunci` adalah tanggal periode (misalnya '2026-08-28'), bukan waktu kirim —
 * itu yang membuat pengiriman kedua di hari yang sama terdeteksi sebagai ulangan.
 * Baris gagal tetap disimpan supaya bisa diperiksa saat reminder terasa berhenti.
 */
export const notificationLog = sqliteTable(
  'notification_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    job: text('job', { enum: ['harian', 'mingguan'] }).notNull(),
    kunci: text('kunci').notNull(),
    tujuan: text('tujuan').notNull(),
    status: text('status', { enum: ['terkirim', 'gagal'] }).notNull(),
    error: text('error').notNull().default(''),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('notification_log_unik').on(t.job, t.kunci, t.tujuan)],
);

/** Satu baris saja (id = 1). Sumber kebenaran untuk tanggal & target tamu. */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  namaPria: text('nama_pria').notNull().default(''),
  namaWanita: text('nama_wanita').notNull().default(''),
  tanggalAkad: text('tanggal_akad'),
  tanggalResepsi: text('tanggal_resepsi'),
  venueAkad: text('venue_akad').notNull().default(''),
  venueResepsi: text('venue_resepsi').notNull().default(''),
  targetTamu: integer('target_tamu').notNull().default(0),
  totalBudget: integer('total_budget').notNull().default(0),
  updatedAt: integer('updated_at').notNull().default(now),
});

export const KATEGORI_BUDGET = [
  'katering', 'venue', 'dekorasi', 'mua', 'dokumentasi', 'busana',
  'undangan', 'souvenir', 'cincin', 'seserahan', 'mahar', 'hiburan',
  'transport', 'dokumen', 'lain',
] as const;

export const budgetItems = sqliteTable('budget_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kategori: text('kategori', { enum: KATEGORI_BUDGET }).notNull(),
  nama: text('nama').notNull(),
  /** per_pax dikalikan settings.targetTamu saat render, tidak disimpan. */
  tipe: text('tipe', { enum: ['lumpsum', 'per_pax'] }).notNull().default('lumpsum'),
  hargaSatuan: integer('harga_satuan').notNull().default(0),
  qty: integer('qty').notNull().default(1),
  aktual: integer('aktual'),
  /** Teks bebas — sengaja BUKAN foreign key ke vendors (modul terpisah). */
  vendorNama: text('vendor_nama').notNull().default(''),
  catatan: text('catatan').notNull().default(''),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetItemId: integer('budget_item_id')
    .notNull()
    .references(() => budgetItems.id, { onDelete: 'cascade' }),
  jenis: text('jenis', { enum: ['dp', 'termin', 'pelunasan'] }).notNull(),
  jumlah: integer('jumlah').notNull().default(0),
  jatuhTempo: text('jatuh_tempo').notNull(),
  status: text('status', { enum: ['belum', 'lunas'] }).notNull().default('belum'),
  dibayarTanggal: text('dibayar_tanggal'),
  metode: text('metode').notNull().default(''),
  catatan: text('catatan').notNull().default(''),
});

export const STATUS_VENDOR = ['shortlist', 'survei', 'nego', 'booked', 'batal'] as const;

export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kategori: text('kategori', { enum: KATEGORI_BUDGET }).notNull(),
  status: text('status', { enum: STATUS_VENDOR }).notNull().default('shortlist'),
  kontakNama: text('kontak_nama').notNull().default(''),
  whatsapp: text('whatsapp').notNull().default(''),
  instagram: text('instagram').notNull().default(''),
  website: text('website').notNull().default(''),
  lokasi: text('lokasi').notNull().default(''),
  hargaPenawaran: integer('harga_penawaran').notNull().default(0),
  rating: integer('rating'),
  catatan: text('catatan').notNull().default(''),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
});

export const vendorFiles = sqliteTable('vendor_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorId: integer('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'cascade' }),
  namaAsli: text('nama_asli').notNull(),
  path: text('path').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: integer('created_at').notNull().default(now),
});

/** Urutan fase menentukan urutan tampil di halaman checklist. */
export const FASE = [
  'pra', 't12_11', 't10_9', 't8_6', 't5_3', 't2', 't1', 't7hari', 'hariH', 'pasca',
] as const;

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi').notNull().default(''),
  kategori: text('kategori').notNull().default(''),
  fase: text('fase', { enum: FASE }).notNull(),
  /** Hari sebelum tanggal resepsi. null untuk fase 'pra' dan 'pasca'. */
  offsetHari: integer('offset_hari'),
  dueDateOverride: text('due_date_override'),
  assignee: text('assignee', { enum: ['pria', 'wanita', 'berdua'] }).notNull().default('berdua'),
  status: text('status', { enum: ['todo', 'doing', 'done'] }).notNull().default('todo'),
  doneAt: integer('done_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  /** true untuk baris hasil seed, supaya seed idempoten. */
  dariTemplate: integer('dari_template', { mode: 'boolean' }).notNull().default(false),
});

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  pihak: text('pihak', { enum: ['pria', 'wanita', 'berdua'] }).notNull(),
  status: text('status', { enum: ['belum', 'proses', 'selesai'] }).notNull().default('belum'),
  instansi: text('instansi').notNull().default(''),
  deadline: text('deadline'),
  catatan: text('catatan').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  dariTemplate: integer('dari_template', { mode: 'boolean' }).notNull().default(false),
});

export const rundownItems = sqliteTable('rundown_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  acara: text('acara', { enum: ['akad', 'resepsi'] }).notNull(),
  waktuMulai: text('waktu_mulai').notNull(),
  waktuSelesai: text('waktu_selesai').notNull().default(''),
  kegiatan: text('kegiatan').notNull(),
  pic: text('pic').notNull().default(''),
  catatan: text('catatan').notNull().default(''),
});

export const ideas = sqliteTable('ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  judul: text('judul').notNull(),
  url: text('url').notNull().default(''),
  kategori: text('kategori').notNull().default(''),
  catatan: text('catatan').notNull().default(''),
  favorit: integer('favorit', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(now),
});

export const decisions = sqliteTable('decisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topik: text('topik').notNull(),
  keputusan: text('keputusan').notNull(),
  alasan: text('alasan').notNull().default(''),
  tanggal: text('tanggal').notNull(),
  oleh: text('oleh', { enum: ['pria', 'wanita', 'berdua'] }).notNull().default('berdua'),
});

export const KATEGORI_SESERAHAN = [
  'pakaian', 'ibadah', 'kosmetik', 'makanan', 'perhiasan', 'lain',
] as const;

export const seserahanItems = sqliteTable('seserahan_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kategori: text('kategori', { enum: KATEGORI_SESERAHAN }).notNull().default('lain'),
  isMahar: integer('is_mahar', { mode: 'boolean' }).notNull().default(false),
  estimasi: integer('estimasi').notNull().default(0),
  aktual: integer('aktual'),
  status: text('status', { enum: ['belum', 'dibeli'] }).notNull().default('belum'),
  catatan: text('catatan').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type Settings = typeof settings.$inferSelect;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type VendorFile = typeof vendorFiles.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type RundownItem = typeof rundownItems.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Decision = typeof decisions.$inferSelect;
export type SeserahanItem = typeof seserahanItems.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NotificationLog = typeof notificationLog.$inferSelect;
export type User = typeof users.$inferSelect;
