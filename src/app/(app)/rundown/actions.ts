'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { rundownItems } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaRundown } from '@/lib/validators';

function segarkan() {
  revalidatePath('/rundown');
}

export async function buatRundown(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaRundown, formData, async (data) => {
    await db.insert(rundownItems).values(data);
    segarkan();
  });
}

export async function ubahRundown(id: number, _prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaRundown, formData, async (data) => {
    await db.update(rundownItems).set(data).where(eq(rundownItems.id, id));
    segarkan();
  });
}

export async function hapusRundown(id: number) {
  return jalankanAksiSederhana(async () => {
    await db.delete(rundownItems).where(eq(rundownItems.id, id));
    segarkan();
  });
}
