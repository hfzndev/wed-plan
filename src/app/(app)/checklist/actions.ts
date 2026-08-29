'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, type HasilAksi } from '@/lib/aksi';
import { skemaTask } from '@/lib/validators';
import { offsetUntukFase } from '@/lib/timeline';
import { FASE } from '@/db/schema';

function segarkan() {
  revalidatePath('/checklist');
  revalidatePath('/');
}

export async function buatTask(_prev: HasilAksi | null, formData: FormData) {
  const hasil = await jalankanAksi(skemaTask, formData, async (data) => {
    await db.insert(tasks).values({ ...data, offsetHari: null, dariTemplate: false });
    segarkan();
  });
  if (hasil.ok) redirect('/checklist');
  return hasil;
}

export async function ubahTask(id: number, _prev: HasilAksi | null, formData: FormData) {
  const hasil = await jalankanAksi(skemaTask, formData, async (data) => {
    await db.update(tasks).set(data).where(eq(tasks.id, id));
    segarkan();
    revalidatePath(`/checklist/${id}`);
  });
  if (hasil.ok) redirect('/checklist');
  return hasil;
}

export async function toggleTask(id: number, selesai: boolean) {
  return jalankanAksiSederhana(async () => {
    await db
      .update(tasks)
      .set({
        status: selesai ? 'done' : 'todo',
        doneAt: selesai ? Math.floor(Date.now() / 1000) : null,
      })
      .where(eq(tasks.id, id));
    segarkan();
  });
}

/**
 * Memindahkan task ke fase lain — dipakai drag dan tombol ‹ › di papan.
 *
 * `offsetHari` ikut diubah, bukan hanya `fase`. `dueDateTask()` menghitung
 * tanggal dari offset, jadi kalau hanya fase yang berpindah, kartu akan duduk di
 * kolom "8–6 bulan" sambil menampilkan tanggal empat bulan lagi.
 *
 * Task yang tanggalnya dikunci manual (`dueDateOverride`) tetap memakai tanggal
 * itu — aturan "override selalu menang" tidak diubah di sini.
 */
export async function pindahFase(id: number, fase: string) {
  return jalankanAksiSederhana(async () => {
    if (!FASE.includes(fase as (typeof FASE)[number])) {
      throw new Error(`Fase "${fase}" tidak dikenal`);
    }
    await db
      .update(tasks)
      .set({
        fase: fase as (typeof FASE)[number],
        offsetHari: offsetUntukFase(fase),
      })
      .where(eq(tasks.id, id));
    segarkan();
  });
}

export async function hapusTask(id: number) {
  const hasil = await jalankanAksiSederhana(async () => {
    await db.delete(tasks).where(eq(tasks.id, id));
    segarkan();
  });
  if (hasil.ok) redirect('/checklist');
  return hasil;
}
