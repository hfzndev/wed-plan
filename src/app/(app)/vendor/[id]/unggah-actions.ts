'use server';

import { revalidatePath } from 'next/cache';
import { wajibLogin } from '@/lib/auth';
import { simpanBerkasVendor, BerkasDitolak } from '@/lib/berkas';
import type { HasilAksi } from '@/lib/validators';

/**
 * Upload tidak lewat `jalankanAksi` karena FormData-nya berisi File, bukan
 * field teks yang bisa diparse Zod.
 */
export async function unggahBerkas(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  try {
    await wajibLogin();
  } catch {
    return { ok: false, pesan: 'Sesi berakhir. Muat ulang halaman lalu masuk lagi.' };
  }

  const vendorId = Number(formData.get('vendorId'));
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return { ok: false, pesan: 'Vendor tidak valid.' };
  }

  const file = formData.get('berkas');
  if (!(file instanceof File)) return { ok: false, pesan: 'Pilih berkas dulu.' };

  try {
    await simpanBerkasVendor(vendorId, file);
    revalidatePath(`/vendor/${vendorId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof BerkasDitolak) return { ok: false, pesan: err.message };
    console.error('[unggah]', err);
    return { ok: false, pesan: 'Gagal mengunggah. Coba lagi.' };
  }
}
