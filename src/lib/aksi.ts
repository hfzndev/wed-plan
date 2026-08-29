import 'server-only';
import { z } from 'zod';
import { wajibLogin } from './auth';
import { pesanError, type HasilAksi } from './validators';

export type { HasilAksi };

/**
 * Kesalahan yang memang ingin dibaca pengguna ("Password lama salah").
 * Error lain sengaja disembunyikan di balik pesan generik supaya detail internal
 * tidak bocor ke klien.
 */
export class KesalahanPengguna extends Error {}

async function bungkus(kerjakan: () => Promise<void>, pesanGagal: string): Promise<HasilAksi> {
  try {
    await kerjakan();
    return { ok: true };
  } catch (err) {
    if (err instanceof KesalahanPengguna) return { ok: false, pesan: err.message };
    console.error('[aksi]', err);
    return { ok: false, pesan: pesanGagal };
  }
}

/**
 * Pembungkus seragam untuk server action berbasis form:
 * cek sesi → parse FormData dengan Zod → jalankan.
 */
export async function jalankanAksi<S extends z.ZodType>(
  skema: S,
  formData: FormData,
  kerjakan: (data: z.output<S>) => Promise<void>,
): Promise<HasilAksi> {
  try {
    await wajibLogin();
  } catch {
    return { ok: false, pesan: 'Sesi berakhir. Muat ulang halaman lalu masuk lagi.' };
  }

  const hasil = skema.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: pesanError(hasil.error) };

  return bungkus(() => kerjakan(hasil.data), 'Gagal menyimpan. Coba lagi.');
}

/** Untuk aksi tanpa form: hapus, toggle status, dan sejenisnya. */
export async function jalankanAksiSederhana(kerjakan: () => Promise<void>): Promise<HasilAksi> {
  try {
    await wajibLogin();
  } catch {
    return { ok: false, pesan: 'Sesi berakhir. Muat ulang halaman lalu masuk lagi.' };
  }
  return bungkus(kerjakan, 'Gagal memproses. Coba lagi.');
}
