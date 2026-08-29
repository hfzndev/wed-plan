import 'server-only';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { budgetItems, payments, tasks, users, notificationLog } from '@/db/schema';
import { ambilSettings } from './pengaturan';
import { ringkasBudget } from './budget';
import { dueDateTask, hariIni, selisihHari } from './timeline';
import { kirimWhatsApp, wahaSiap } from './waha';
import {
  pesanHarian,
  pesanMingguan,
  AMBANG_BAYAR_HARI,
  type BayarReminder,
} from './pesan-reminder';

export type Job = 'harian' | 'mingguan';

export interface HasilJob {
  job: Job;
  kunci: string;
  /** Tidak ada isi yang layak dikirim — bukan kegagalan. */
  kosong: boolean;
  terkirim: string[];
  gagal: { tujuan: string; error: string }[];
  dilewati: string[];
}

/** Nomor yang berhak menerima: terisi, aktif, dan tidak diblokir. */
async function nomorTujuan() {
  const baris = await db
    .select({ nama: users.nama, whatsapp: users.whatsapp, waAktif: users.waAktif })
    .from(users);
  return baris.filter((u) => u.waAktif && u.whatsapp.trim().length > 0);
}

async function dataPembayaranBelumLunas(): Promise<BayarReminder[]> {
  const rows = await db
    .select({
      namaItem: budgetItems.nama,
      jenis: payments.jenis,
      jumlah: payments.jumlah,
      jatuhTempo: payments.jatuhTempo,
    })
    .from(payments)
    .innerJoin(budgetItems, eq(payments.budgetItemId, budgetItems.id))
    .where(eq(payments.status, 'belum'));
  return rows;
}

async function rakitHarian(acuan: string): Promise<string | null> {
  const settings = await ambilSettings();

  const [semuaTask, pembayaran] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'done')),
    dataPembayaranBelumLunas(),
  ]);

  return pesanHarian(
    {
      tanggalResepsi: settings.tanggalResepsi,
      task: semuaTask.map((t) => ({
        judul: t.judul,
        dueDate: dueDateTask(t, settings.tanggalResepsi),
        assignee: t.assignee,
      })),
      pembayaran,
    },
    acuan,
  );
}

async function rakitMingguan(acuan: string): Promise<string> {
  const settings = await ambilSettings();

  const [semuaTask, items, pembayaran] = await Promise.all([
    db.select().from(tasks),
    db.select().from(budgetItems),
    dataPembayaranBelumLunas(),
  ]);

  const budget = ringkasBudget(items, settings.targetTamu, settings.totalBudget);

  const belumSelesai = semuaTask.filter((t) => t.status !== 'done');
  const taskTelat = belumSelesai.filter((t) => {
    const due = dueDateTask(t, settings.tanggalResepsi);
    if (!due) return false;
    const sisa = selisihHari(acuan, due);
    return sisa !== null && sisa < 0;
  }).length;

  const dengan = pembayaran.map((p) => ({ ...p, sisa: selisihHari(acuan, p.jatuhTempo) }));

  return pesanMingguan(
    {
      tanggalResepsi: settings.tanggalResepsi,
      taskSelesai: semuaTask.length - belumSelesai.length,
      taskTotal: semuaTask.length,
      taskTelat,
      totalBudget: settings.totalBudget,
      totalKomitmen: budget.totalKomitmen,
      bayarMingguIni: dengan
        .filter((p) => p.sisa !== null && p.sisa >= 0 && p.sisa <= AMBANG_BAYAR_HARI)
        .sort((a, b) => (a.sisa ?? 0) - (b.sisa ?? 0)),
      bayarLewatTempo: dengan
        .filter((p) => p.sisa !== null && p.sisa < 0)
        .reduce((n, p) => n + p.jumlah, 0),
    },
    acuan,
  );
}

/** Sudah pernah dikirim ke nomor ini untuk periode ini? */
async function sudahDikirim(job: Job, kunci: string, tujuan: string): Promise<boolean> {
  const [ada] = await db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.job, job),
        eq(notificationLog.kunci, kunci),
        eq(notificationLog.tujuan, tujuan),
        eq(notificationLog.status, 'terkirim'),
      ),
    )
    .limit(1);
  return Boolean(ada);
}

/**
 * Menjalankan satu job reminder.
 *
 * `kunci` adalah tanggal periode, bukan waktu kirim — itu yang membuat cron
 * yang di-retry atau jalan dua kali terdeteksi sebagai ulangan dan dilewati.
 *
 * Baris gagal dicatat juga, bukan hanya yang berhasil: sesi WAHA `webjs` bisa
 * putus diam-diam, dan tanpa jejak ini satu-satunya gejala adalah reminder yang
 * berhenti datang tanpa sebab yang bisa ditelusuri. Gagal tidak menghalangi
 * percobaan ulang besok karena hanya status `terkirim` yang dianggap final.
 */
export async function jalankanJob(job: Job, acuan: string = hariIni()): Promise<HasilJob> {
  const hasil: HasilJob = {
    job,
    kunci: acuan,
    kosong: false,
    terkirim: [],
    gagal: [],
    dilewati: [],
  };

  if (!wahaSiap()) {
    hasil.gagal.push({ tujuan: '-', error: 'waha_belum_dikonfigurasi' });
    return hasil;
  }

  const teks = job === 'harian' ? await rakitHarian(acuan) : await rakitMingguan(acuan);
  if (teks === null) {
    hasil.kosong = true;
    return hasil;
  }

  const tujuan = await nomorTujuan();
  if (tujuan.length === 0) {
    hasil.gagal.push({ tujuan: '-', error: 'tidak_ada_nomor_aktif' });
    return hasil;
  }

  for (const u of tujuan) {
    const nomor = u.whatsapp.trim();

    if (await sudahDikirim(job, acuan, nomor)) {
      hasil.dilewati.push(nomor);
      continue;
    }

    const kirim = await kirimWhatsApp(nomor, teks);

    await db
      .insert(notificationLog)
      .values({
        job,
        kunci: acuan,
        tujuan: nomor,
        status: kirim.ok ? 'terkirim' : 'gagal',
        error: kirim.ok ? '' : kirim.error,
      })
      // Percobaan gagal kemarin tidak boleh memblokir percobaan hari ini.
      .onConflictDoUpdate({
        target: [notificationLog.job, notificationLog.kunci, notificationLog.tujuan],
        set: {
          status: kirim.ok ? 'terkirim' : 'gagal',
          error: kirim.ok ? '' : kirim.error,
        },
      });

    if (kirim.ok) hasil.terkirim.push(nomor);
    else hasil.gagal.push({ tujuan: nomor, error: kirim.error });
  }

  return hasil;
}
