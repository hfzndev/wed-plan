import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vendorFiles } from '@/db/schema';

export const DIR_UPLOAD = process.env.UPLOAD_DIR ?? './data/uploads';

export const MAKS_UKURAN = 10 * 1024 * 1024;

/** Hanya jenis yang benar-benar dipakai untuk kontrak dan quotation. */
export const MIME_DIIZINKAN = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const EKSTENSI: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

export class BerkasDitolak extends Error {}

/**
 * Simpan satu berkas ke disk dengan nama acak.
 *
 * Nama asli dari klien tidak pernah dipakai sebagai nama file — hanya disimpan
 * sebagai teks untuk ditampilkan. Ini menutup path traversal sekaligus tabrakan nama.
 */
export async function simpanBerkasVendor(vendorId: number, file: File) {
  if (file.size === 0) throw new BerkasDitolak('Berkas kosong.');
  if (file.size > MAKS_UKURAN) throw new BerkasDitolak('Ukuran berkas melebihi 10 MB.');
  if (!MIME_DIIZINKAN.has(file.type)) {
    throw new BerkasDitolak('Hanya PDF dan gambar (JPG, PNG, WEBP, HEIC) yang diterima.');
  }

  await mkdir(DIR_UPLOAD, { recursive: true });

  const namaDisk = `${randomUUID()}${EKSTENSI[file.type] ?? ''}`;
  const tujuan = join(/* turbopackIgnore: true */ DIR_UPLOAD, namaDisk);
  await writeFile(tujuan, Buffer.from(await file.arrayBuffer()));

  await db.insert(vendorFiles).values({
    vendorId,
    namaAsli: file.name.slice(0, 200),
    path: namaDisk,
    mime: file.type,
    size: file.size,
  });
}

/**
 * Path absolut sebuah berkas, dipastikan tetap di dalam DIR_UPLOAD.
 * Nilai `path` di database selalu buatan sendiri, tapi pemeriksaan ini menjaga
 * agar baris yang rusak atau dimanipulasi tidak bisa membaca file lain.
 */
export function pathAman(namaDisk: string): string | null {
  // turbopackIgnore: DIR_UPLOAD sengaja dikonfigurasi lewat env agar folder
  // upload bisa diletakkan di luar direktori aplikasi saat deploy di VPS.
  const akar = resolve(/* turbopackIgnore: true */ DIR_UPLOAD);
  const penuh = resolve(akar, namaDisk);
  if (penuh !== akar && !penuh.startsWith(akar + sep)) return null;
  return penuh;
}

export async function hapusBerkasVendor(fileId: number): Promise<number | null> {
  const [baris] = await db.select().from(vendorFiles).where(eq(vendorFiles.id, fileId)).limit(1);
  if (!baris) return null;

  await db.delete(vendorFiles).where(eq(vendorFiles.id, fileId));

  const penuh = pathAman(baris.path);
  if (penuh) await unlink(penuh).catch(() => {});
  return baris.vendorId;
}

export async function hapusSemuaBerkasVendor(vendorId: number) {
  const daftar = await db.select().from(vendorFiles).where(eq(vendorFiles.vendorId, vendorId));
  for (const b of daftar) {
    const penuh = pathAman(b.path);
    if (penuh) await unlink(penuh).catch(() => {});
  }
}

export function ekstensiDariNama(nama: string) {
  return extname(nama).toLowerCase();
}
