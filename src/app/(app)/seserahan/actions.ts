'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { seserahanItems } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaSeserahan } from '@/lib/validators';

function segarkan() {
  revalidatePath('/seserahan');
}

export async function buatSeserahan(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaSeserahan, formData, async (data) => {
    await db.insert(seserahanItems).values(data);
    segarkan();
  });
}

export async function toggleDibeli(id: number) {
  return jalankanAksiSederhana(async () => {
    await db
      .update(seserahanItems)
      .set({
        status: sql`CASE ${seserahanItems.status} WHEN 'dibeli' THEN 'belum' ELSE 'dibeli' END`,
      })
      .where(eq(seserahanItems.id, id));
    segarkan();
  });
}

export async function hapusSeserahan(id: number) {
  return jalankanAksiSederhana(async () => {
    await db.delete(seserahanItems).where(eq(seserahanItems.id, id));
    segarkan();
  });
}
