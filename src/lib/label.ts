import { KATEGORI_BUDGET, KATEGORI_SESERAHAN, STATUS_VENDOR } from '@/db/schema';

export type KategoriBudget = (typeof KATEGORI_BUDGET)[number];
export type StatusVendor = (typeof STATUS_VENDOR)[number];
export type KategoriSeserahan = (typeof KATEGORI_SESERAHAN)[number];

export const LABEL_KATEGORI: Record<KategoriBudget, string> = {
  katering: 'Katering',
  venue: 'Venue / Gedung',
  dekorasi: 'Dekorasi',
  mua: 'MUA & Busana Rias',
  dokumentasi: 'Foto & Video',
  busana: 'Busana',
  undangan: 'Undangan',
  souvenir: 'Souvenir',
  cincin: 'Cincin',
  seserahan: 'Seserahan',
  mahar: 'Mahar',
  hiburan: 'Hiburan',
  transport: 'Transport & Akomodasi',
  dokumen: 'Dokumen & Administrasi',
  lain: 'Lain-lain',
};

export const LABEL_STATUS_VENDOR: Record<StatusVendor, string> = {
  shortlist: 'Shortlist',
  survei: 'Survei',
  nego: 'Nego',
  booked: 'Booked',
  batal: 'Batal',
};

export const LABEL_KATEGORI_SESERAHAN: Record<KategoriSeserahan, string> = {
  pakaian: 'Pakaian',
  ibadah: 'Perlengkapan ibadah',
  kosmetik: 'Kosmetik & perawatan',
  makanan: 'Makanan',
  perhiasan: 'Perhiasan',
  lain: 'Lain-lain',
};

export const LABEL_PIHAK = {
  pria: 'Mempelai pria',
  wanita: 'Mempelai wanita',
  berdua: 'Berdua',
} as const;

export const LABEL_JENIS_BAYAR = {
  dp: 'DP',
  termin: 'Termin',
  pelunasan: 'Pelunasan',
} as const;

export const OPSI_KATEGORI = KATEGORI_BUDGET.map((k) => ({ nilai: k, label: LABEL_KATEGORI[k] }));
export const OPSI_STATUS_VENDOR = STATUS_VENDOR.map((s) => ({
  nilai: s,
  label: LABEL_STATUS_VENDOR[s],
}));
export const OPSI_KATEGORI_SESERAHAN = KATEGORI_SESERAHAN.map((k) => ({
  nilai: k,
  label: LABEL_KATEGORI_SESERAHAN[k],
}));
