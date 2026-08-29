import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  budgetItems,
  payments,
  tasks,
  vendors,
  documents,
  seserahanItems,
  FASE,
} from '@/db/schema';
import { ambilSettings } from './pengaturan';
import { ringkasBudget, ringkasPembayaran } from './budget';
import { dueDateTask, hariIni, hitungMundur, selisihHari } from './timeline';
import { formatSnapshot, type SnapshotData, type SnapshotFase } from './konteks-wedding';

/** Vendor yang dibawa ke konteks. Batas ini yang menjaga prompt tetap terduga ukurannya. */
const MAKS_VENDOR = 30;

/**
 * Mengambil seluruh data dan merakitnya jadi snapshot teks.
 *
 * Semua perhitungan memakai ulang fungsi yang sudah dipakai UI —
 * `ringkasBudget`, `ringkasPembayaran`, `dueDateTask` — supaya angka yang
 * dibaca AI persis sama dengan yang dilihat di layar. Kalau dihitung ulang di
 * sini, dua sumber kebenaran itu pasti akan berbeda cepat atau lambat.
 */
export async function ambilSnapshot(acuan: string = hariIni()): Promise<string> {
  const settings = await ambilSettings();

  const [items, semuaBayar, semuaTask, semuaVendor, semuaDokumen, seserahan] = await Promise.all([
    db.select().from(budgetItems),
    db.select().from(payments),
    db.select().from(tasks),
    db.select().from(vendors).orderBy(asc(vendors.kategori)).limit(MAKS_VENDOR),
    db.select().from(documents),
    db.select().from(seserahanItems),
  ]);

  const budget = ringkasBudget(items, settings.targetTamu, settings.totalBudget);
  const bayar = ringkasPembayaran(semuaBayar, acuan);

  const taskDenganTanggal = semuaTask.map((t) => {
    const due = dueDateTask(t, settings.tanggalResepsi);
    const sisa = due ? selisihHari(acuan, due) : null;
    return {
      fase: t.fase,
      selesai: t.status === 'done',
      telat: t.status !== 'done' && sisa !== null && sisa < 0,
    };
  });

  const perFase: SnapshotFase[] = FASE.map((f) => {
    const dalamFase = taskDenganTanggal.filter((t) => t.fase === f);
    return {
      fase: f,
      total: dalamFase.length,
      selesai: dalamFase.filter((t) => t.selesai).length,
      telat: dalamFase.filter((t) => t.telat).length,
    };
  });

  const data: SnapshotData = {
    namaPria: settings.namaPria,
    namaWanita: settings.namaWanita,
    tanggalAkad: settings.tanggalAkad,
    tanggalResepsi: settings.tanggalResepsi,
    venueAkad: settings.venueAkad,
    venueResepsi: settings.venueResepsi,
    sisaHariResepsi: hitungMundur(settings.tanggalResepsi, acuan),
    targetTamu: settings.targetTamu,

    totalBudget: settings.totalBudget,
    totalEstimasi: budget.totalEstimasi,
    totalKomitmen: budget.totalKomitmen,
    persenKatering: budget.persenKatering,
    perKategori: budget.perKategori.map((k) => ({
      kategori: k.kategori,
      komitmen: k.komitmen,
      jumlahItem: k.jumlahItem,
    })),

    bayarLunas: bayar.totalLunas,
    bayarBelum: bayar.totalBelum,
    bayarLewatTempo: bayar.lewatTempo,

    taskSelesai: taskDenganTanggal.filter((t) => t.selesai).length,
    taskTotal: taskDenganTanggal.length,
    taskTelat: taskDenganTanggal.filter((t) => t.telat).length,
    perFase,

    vendor: semuaVendor.map((v) => ({
      nama: v.nama,
      kategori: v.kategori,
      status: v.status,
      hargaPenawaran: v.hargaPenawaran,
    })),

    dokumenSelesai: semuaDokumen.filter((d) => d.status === 'selesai').length,
    dokumenTotal: semuaDokumen.length,

    seserahanTotal: seserahan.reduce((n, s) => n + (s.aktual ?? s.estimasi), 0),
    seserahanDibeli: seserahan.filter((s) => s.status === 'dibeli').length,
    seserahanJumlah: seserahan.length,
  };

  return formatSnapshot(data);
}

/** Dipakai halaman AI untuk tahu apakah ada gunanya menawarkan tombol Analisa. */
export async function adaDataCukup(): Promise<boolean> {
  const [item] = await db.select({ id: budgetItems.id }).from(budgetItems).limit(1);
  const settings = await ambilSettings();
  return Boolean(item) || settings.tanggalResepsi !== null || settings.totalBudget > 0;
}

export { eq };
