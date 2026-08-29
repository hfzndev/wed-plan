import { FASE } from '@/db/schema';

export type Fase = (typeof FASE)[number];

export const LABEL_FASE: Record<Fase, string> = {
  pra: 'Sebelum tanggal ditentukan',
  t12_11: '12–11 bulan sebelum',
  t10_9: '10–9 bulan sebelum',
  t8_6: '8–6 bulan sebelum',
  t5_3: '5–3 bulan sebelum',
  t2: '2 bulan sebelum',
  t1: '1 bulan sebelum',
  t7hari: '7 hari terakhir',
  hariH: 'Hari H',
  pasca: 'Setelah acara',
};

export const URUTAN_FASE: readonly Fase[] = FASE;

/**
 * Offset wakil tiap fase, dipakai saat sebuah task dipindah antar kolom di papan.
 *
 * `dueDateTask()` menghitung tanggal dari `offsetHari`, bukan dari `fase` — fase
 * hanya label pengelompokan. Jadi memindah kolom tanpa menyentuh offset akan
 * membuat kartu duduk di kolom "8–6 bulan" sambil menampilkan tanggal 4 bulan
 * lagi; kolom dan tanggal saling membantah.
 *
 * Angkanya diambil dari titik tengah rentang yang dipakai template di
 * `src/db/template.ts`, jadi task yang dipindah mendarat di tengah fase barunya,
 * bukan di tepinya.
 *
 * `pra` dan `pasca` sengaja null: keduanya memang tidak terikat tanggal resepsi.
 */
export const OFFSET_FASE: Record<Fase, number | null> = {
  pra: null,
  t12_11: 335,
  t10_9: 290,
  t8_6: 210,
  t5_3: 120,
  t2: 52,
  t1: 22,
  t7hari: 4,
  hariH: 0,
  pasca: null,
};

/**
 * Offset untuk sebuah fase. Fase tak dikenal mengembalikan null — task jadi
 * tanpa tanggal, bukan tanggal ngawur hasil tebakan.
 */
export function offsetUntukFase(fase: string): number | null {
  if (!(fase in OFFSET_FASE)) return null;
  return OFFSET_FASE[fase as Fase];
}

/**
 * Tanggal disimpan sebagai string "YYYY-MM-DD" dan diperlakukan sebagai tanggal
 * kalender polos — bukan instant. Ini menghindari pergeseran satu hari akibat
 * timezone antara VPS dan HP.
 */
export function parseTanggal(iso: string): { y: number; m: number; d: number } | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!cocok) return null;
  const y = Number(cocok[1]);
  const m = Number(cocok[2]);
  const d = Number(cocok[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  // Tolak tanggal yang "menggulung", misalnya 2026-02-31.
  const cek = new Date(Date.UTC(y, m - 1, d));
  if (cek.getUTCMonth() !== m - 1 || cek.getUTCDate() !== d) return null;
  return { y, m, d };
}

function keUtc(iso: string): number | null {
  const t = parseTanggal(iso);
  return t ? Date.UTC(t.y, t.m - 1, t.d) : null;
}

function dariUtc(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

const HARI_MS = 86_400_000;

/** Tanggal hari ini di zona Asia/Jakarta, sebagai "YYYY-MM-DD". */
export function hariIni(sekarang: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(sekarang);
}

/** Selisih hari kalender: b − a. Positif berarti b setelah a. */
export function selisihHari(a: string, b: string): number | null {
  const ua = keUtc(a);
  const ub = keUtc(b);
  if (ua === null || ub === null) return null;
  return Math.round((ub - ua) / HARI_MS);
}

/** Sisa hari menuju tanggal target. Negatif berarti sudah lewat. */
export function hitungMundur(target: string | null, dari: string = hariIni()): number | null {
  if (!target) return null;
  return selisihHari(dari, target);
}

export interface TaskTanggal {
  offsetHari: number | null;
  dueDateOverride: string | null;
}

/**
 * Jatuh tempo sebuah task.
 *
 * Prioritas: override manual selalu menang. Kalau tidak ada override, tanggal
 * dihitung mundur dari tanggal resepsi sebanyak `offsetHari`. Selama tanggal
 * resepsi belum diisi, hasilnya null dan UI menampilkan task tanpa tanggal —
 * bukan tanggal tebakan.
 */
export function dueDateTask(task: TaskTanggal, tanggalResepsi: string | null): string | null {
  if (task.dueDateOverride) return task.dueDateOverride;
  if (!tanggalResepsi || task.offsetHari === null) return null;
  const hariH = keUtc(tanggalResepsi);
  if (hariH === null) return null;
  return dariUtc(hariH - task.offsetHari * HARI_MS);
}

/** True kalau jatuh tempo sudah lewat dan task belum selesai. */
export function lewatTempo(dueDate: string | null, selesai: boolean, dari: string = hariIni()): boolean {
  if (selesai || !dueDate) return false;
  const sisa = selisihHari(dari, dueDate);
  return sisa !== null && sisa < 0;
}

const LABEL_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const LABEL_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** "Sabtu, 12 September 2026" */
export function tanggalPanjang(iso: string): string {
  const t = parseTanggal(iso);
  if (!t) return iso;
  const hari = LABEL_HARI[new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay()];
  return `${hari}, ${t.d} ${LABEL_BULAN[t.m - 1]} ${t.y}`;
}

/** "12 Sep 2026" */
export function tanggalPendek(iso: string): string {
  const t = parseTanggal(iso);
  if (!t) return iso;
  return `${t.d} ${LABEL_BULAN[t.m - 1].slice(0, 3)} ${t.y}`;
}
