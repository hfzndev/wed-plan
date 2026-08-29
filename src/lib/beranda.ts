import 'server-only';
import { asc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { budgetItems, payments, tasks, documents } from '@/db/schema';
import { ambilSettings } from './pengaturan';
import { ringkasBudget, ringkasPembayaran } from './budget';
import { dueDateTask, hitungMundur, hariIni, selisihHari, URUTAN_FASE } from './timeline';

export interface TaskTerdekat {
  id: number;
  judul: string;
  fase: string;
  dueDate: string | null;
  sisaHari: number | null;
  assignee: 'pria' | 'wanita' | 'berdua';
}

export async function ringkasanBeranda() {
  const settings = await ambilSettings();
  const acuan = hariIni();

  const [itemBudget, semuaPembayaran, semuaTask, semuaDokumen] = await Promise.all([
    db.select().from(budgetItems),
    db.select().from(payments),
    db.select().from(tasks).where(ne(tasks.status, 'done')),
    db.select().from(documents),
  ]);

  const budget = ringkasBudget(itemBudget, settings.targetTamu, settings.totalBudget);
  const pembayaran = ringkasPembayaran(semuaPembayaran, acuan);

  const belumSelesai: TaskTerdekat[] = semuaTask.map((t) => {
    const dueDate = dueDateTask(t, settings.tanggalResepsi);
    return {
      id: t.id,
      judul: t.judul,
      fase: t.fase,
      dueDate,
      sisaHari: dueDate ? selisihHari(acuan, dueDate) : null,
      assignee: t.assignee,
    };
  });

  // Yang punya tanggal naik ke atas, diurutkan dari yang paling mendesak.
  // Yang belum punya tanggal (fase 'pra') mengikut urutan fase.
  const bertanggal = belumSelesai
    .filter((t) => t.sisaHari !== null)
    .sort((a, b) => (a.sisaHari ?? 0) - (b.sisaHari ?? 0));
  const tanpaTanggal = belumSelesai
    .filter((t) => t.sisaHari === null)
    .sort(
      (a, b) =>
        URUTAN_FASE.indexOf(a.fase as (typeof URUTAN_FASE)[number]) -
        URUTAN_FASE.indexOf(b.fase as (typeof URUTAN_FASE)[number]),
    );

  const taskTerdekat = (settings.tanggalResepsi ? bertanggal : tanpaTanggal).slice(0, 4);

  const pembayaranMendatang = semuaPembayaran
    .filter((p) => p.status === 'belum')
    .map((p) => ({ ...p, sisaHari: selisihHari(acuan, p.jatuhTempo) }))
    .filter((p) => p.sisaHari !== null && p.sisaHari <= 30)
    .sort((a, b) => (a.sisaHari ?? 0) - (b.sisaHari ?? 0))
    .slice(0, 3);

  const dokumenSelesai = semuaDokumen.filter((d) => d.status === 'selesai').length;

  return {
    settings,
    budget,
    pembayaran,
    pembayaranMendatang,
    taskTerdekat,
    sisaTask: belumSelesai.length,
    dokumen: { selesai: dokumenSelesai, total: semuaDokumen.length },
    mundurAkad: hitungMundur(settings.tanggalAkad, acuan),
    mundurResepsi: hitungMundur(settings.tanggalResepsi, acuan),
  };
}

/** Judul item budget untuk ditampilkan di baris pembayaran. */
export async function petaNamaBudget() {
  const rows = await db
    .select({ id: budgetItems.id, nama: budgetItems.nama })
    .from(budgetItems)
    .orderBy(asc(budgetItems.nama));
  return new Map(rows.map((r) => [r.id, r.nama]));
}

export async function itemBudgetById(id: number) {
  const [row] = await db.select().from(budgetItems).where(eq(budgetItems.id, id)).limit(1);
  return row ?? null;
}
