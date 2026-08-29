'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaDokumen } from '@/lib/validators';

function segarkan() {
  revalidatePath('/dokumen');
  revalidatePath('/');
}

export async function buatDokumen(_prev: HasilAksi | null, formData: FormData) {
  const hasil = await jalankanAksi(skemaDokumen, formData, async (data) => {
    await db.insert(documents).values({ ...data, dariTemplate: false });
    segarkan();
  });
  if (hasil.ok) redirect('/dokumen');
  return hasil;
}

export async function ubahDokumen(id: number, _prev: HasilAksi | null, formData: FormData) {
  const hasil = await jalankanAksi(skemaDokumen, formData, async (data) => {
    await db.update(documents).set(data).where(eq(documents.id, id));
    segarkan();
  });
  if (hasil.ok) redirect('/dokumen');
  return hasil;
}

/** Klik pada baris memutar status: belum → proses → selesai → belum. */
export async function putarStatusDokumen(id: number, berikutnya: 'belum' | 'proses' | 'selesai') {
  return jalankanAksiSederhana(async () => {
    await db.update(documents).set({ status: berikutnya }).where(eq(documents.id, id));
    segarkan();
  });
}

export async function hapusDokumen(id: number) {
  const hasil = await jalankanAksiSederhana(async () => {
    await db.delete(documents).where(eq(documents.id, id));
    segarkan();
  });
  if (hasil.ok) redirect('/dokumen');
  return hasil;
}
