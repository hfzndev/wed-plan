'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { ideas, decisions } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaIde, skemaKeputusan } from '@/lib/validators';

function segarkan() {
  revalidatePath('/ide');
}

export async function buatIde(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaIde, formData, async (data) => {
    await db.insert(ideas).values(data);
    segarkan();
  });
}

export async function toggleFavorit(id: number) {
  return jalankanAksiSederhana(async () => {
    await db
      .update(ideas)
      .set({ favorit: sql`NOT ${ideas.favorit}` })
      .where(eq(ideas.id, id));
    segarkan();
  });
}

export async function hapusIde(id: number) {
  return jalankanAksiSederhana(async () => {
    await db.delete(ideas).where(eq(ideas.id, id));
    segarkan();
  });
}

export async function buatKeputusan(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaKeputusan, formData, async (data) => {
    await db.insert(decisions).values(data);
    segarkan();
  });
}

export async function hapusKeputusan(id: number) {
  return jalankanAksiSederhana(async () => {
    await db.delete(decisions).where(eq(decisions.id, id));
    segarkan();
  });
}
