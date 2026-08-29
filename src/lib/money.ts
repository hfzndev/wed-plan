/**
 * Semua nominal di app ini adalah integer rupiah — tanpa desimal, tanpa float.
 * Rupiah tidak punya pecahan yang dipakai sehari-hari, jadi menyimpan sen hanya
 * mengundang error pembulatan.
 */

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** "Rp 12.500.000" */
export function rupiah(nominal: number): string {
  return formatter.format(nominal).replace(/\u00a0/g, ' ');
}

/** "12.500.000" — untuk dipakai di sebelah label "Rp" yang sudah ada. */
export function angka(nominal: number): string {
  return plainFormatter.format(nominal);
}

/**
 * Ringkas untuk kartu sempit: 12,5 jt / 1,2 M.
 * Di bawah satu juta tetap ditulis penuh supaya tidak ambigu.
 */
export function rupiahRingkas(nominal: number): string {
  const abs = Math.abs(nominal);
  const tanda = nominal < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${tanda}Rp ${bulatkan(abs / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `${tanda}Rp ${bulatkan(abs / 1_000_000)} jt`;
  if (abs >= 1_000) return `${tanda}Rp ${bulatkan(abs / 1_000)} rb`;
  return rupiah(nominal);
}

// plainFormatter membuang desimal, jadi bentuk ringkas butuh formatter sendiri —
// tanpa ini Rp 1.500.000 tampil sebagai "Rp 2 jt".
const ringkasFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

function bulatkan(n: number): string {
  return ringkasFormatter.format(n);
}

/**
 * Membaca angka yang diketik manusia: "12.500.000", "12500000", "Rp 12.500.000".
 * Mengembalikan 0 kalau tidak ada digit sama sekali.
 */
export function parseRupiah(input: string): number {
  const digits = input.replace(/[^\d-]/g, '');
  if (!digits || digits === '-') return 0;
  return Math.trunc(Number(digits));
}

/** Persentase bagian terhadap total, dibulatkan. 0 kalau total nol. */
export function persen(bagian: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((bagian / total) * 100);
}
