import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { ambilSettings } from '@/lib/pengaturan';
import { dueDateTask, tanggalPanjang } from '@/lib/timeline';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormTask } from '../form-task';
import { TombolHapusTask } from './tombol-hapus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanUbahTask({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) notFound();

  const [settings, [task]] = await Promise.all([
    ambilSettings(),
    db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1),
  ]);

  if (!task) notFound();

  const otomatis = dueDateTask({ offsetHari: task.offsetHari, dueDateOverride: null }, settings.tanggalResepsi);

  return (
    <>
      <TautanKembali href="/checklist" label="Checklist" />
      <KepalaHalaman judul="Ubah task" />
      <FormTask awal={task} dueOtomatis={otomatis ? tanggalPanjang(otomatis) : null} />
      <div className="mx-5 mt-4 mb-8">
        <TombolHapusTask id={task.id} judul={task.judul} />
      </div>
    </>
  );
}
