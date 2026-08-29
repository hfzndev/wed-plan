'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { budgetItems, payments } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaBudgetItem, skemaPembayaran } from '@/lib/validators';

function segarkan(id?: number) {
  revalidatePath('/budget');
  revalidatePath('/');
  if (id) revalidatePath(`/budget/${id}`);
}

export async function buatItemBudget(_prev: HasilAksi | null, formData: FormData) {
  let baruId: number | null = null;

  const hasil = await jalankanAksi(skemaBudgetItem, formData, async (data) => {
    const [baris] = await db.insert(budgetItems).values(data).returning({ id: budgetItems.id });
    baruId = baris?.id ?? null;
    segarkan();
  });

  if (hasil.ok && baruId !== null) redirect(`/budget/${baruId}`);
  return hasil;
}

export async function ubahItemBudget(id: number, _prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaBudgetItem, formData, async (data) => {
    await db
      .update(budgetItems)
      .set({ ...data, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(budgetItems.id, id));
    segarkan(id);
  });
}

export async function hapusItemBudget(id: number) {
  const hasil = await jalankanAksiSederhana(async () => {
    // payments ikut terhapus lewat ON DELETE CASCADE.
    await db.delete(budgetItems).where(eq(budgetItems.id, id));
    segarkan();
  });
  if (hasil.ok) redirect('/budget');
  return hasil;
}

export async function buatPembayaran(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaPembayaran, formData, async (data) => {
    await db.insert(payments).values({
      ...data,
      dibayarTanggal: data.status === 'lunas' ? data.jatuhTempo : null,
    });
    segarkan(data.budgetItemId);
  });
}

export async function tandaiPembayaran(id: number, lunas: boolean) {
  return jalankanAksiSederhana(async () => {
    const [baris] = await db
      .update(payments)
      .set({
        status: lunas ? 'lunas' : 'belum',
        dibayarTanggal: lunas ? new Date().toISOString().slice(0, 10) : null,
      })
      .where(eq(payments.id, id))
      .returning({ budgetItemId: payments.budgetItemId });
    segarkan(baris?.budgetItemId);
  });
}

export async function hapusPembayaran(id: number) {
  return jalankanAksiSederhana(async () => {
    const [baris] = await db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning({ budgetItemId: payments.budgetItemId });
    segarkan(baris?.budgetItemId);
  });
}
