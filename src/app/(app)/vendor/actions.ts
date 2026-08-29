'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vendors } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaVendor } from '@/lib/validators';
import { hapusBerkasVendor, hapusSemuaBerkasVendor } from '@/lib/berkas';

function segarkan(id?: number) {
  revalidatePath('/vendor');
  if (id) revalidatePath(`/vendor/${id}`);
}

export async function buatVendor(_prev: HasilAksi | null, formData: FormData) {
  let baruId: number | null = null;

  const hasil = await jalankanAksi(skemaVendor, formData, async (data) => {
    const [baris] = await db.insert(vendors).values(data).returning({ id: vendors.id });
    baruId = baris?.id ?? null;
    segarkan();
  });

  if (hasil.ok && baruId !== null) redirect(`/vendor/${baruId}`);
  return hasil;
}

export async function ubahVendor(id: number, _prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaVendor, formData, async (data) => {
    await db
      .update(vendors)
      .set({ ...data, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(vendors.id, id));
    segarkan(id);
  });
}

export async function hapusVendor(id: number) {
  const hasil = await jalankanAksiSederhana(async () => {
    // Baris vendor_files ikut terhapus lewat cascade, tapi file fisiknya harus
    // dibersihkan sendiri.
    await hapusSemuaBerkasVendor(id);
    await db.delete(vendors).where(eq(vendors.id, id));
    segarkan();
  });
  if (hasil.ok) redirect('/vendor');
  return hasil;
}

export async function hapusBerkas(fileId: number) {
  return jalankanAksiSederhana(async () => {
    const vendorId = await hapusBerkasVendor(fileId);
    segarkan(vendorId ?? undefined);
  });
}
