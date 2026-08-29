import { rupiahRingkas } from './money';
import { selisihHari, tanggalPendek } from './timeline';

/**
 * Perakit pesan reminder WhatsApp.
 *
 * Semua fungsi di sini **murni**: data masuk, string keluar. Tidak ada query,
 * tidak ada jaringan, tidak ada `new Date()` tanpa parameter. Itu yang membuat
 * isi pesannya bisa diuji tuntas — kalau tanggal diambil dari jam sistem, satu-
 * satunya cara memastikan kata "telat" muncul adalah menunggu tiga hari.
 *
 * Format WhatsApp: *tebal*, _miring_. BUKAN HTML, dan tidak ada escaping —
 * lihat catatan di `waha.ts`.
 */

/** Task jatuh tempo dalam N hari ke depan sudah dianggap perlu diingatkan. */
export const AMBANG_TASK_HARI = 3;

/** Uang butuh ancang-ancang lebih panjang daripada pekerjaan. */
export const AMBANG_BAYAR_HARI = 7;

export interface TaskReminder {
  judul: string;
  dueDate: string | null;
  assignee: 'pria' | 'wanita' | 'berdua';
}

export interface BayarReminder {
  namaItem: string;
  jenis: 'dp' | 'termin' | 'pelunasan';
  jumlah: number;
  jatuhTempo: string;
}

export interface DataHarian {
  tanggalResepsi: string | null;
  task: TaskReminder[];
  pembayaran: BayarReminder[];
}

const LABEL_BAYAR = { dp: 'DP', termin: 'Termin', pelunasan: 'Pelunasan' } as const;
const LABEL_SIAPA = { pria: 'pria', wanita: 'wanita', berdua: 'berdua' } as const;

/** "telat 3 hari" / "hari ini" / "3 hari lagi" */
function frasaHari(sisa: number): string {
  if (sisa < 0) return `telat ${Math.abs(sisa)} hari`;
  if (sisa === 0) return 'hari ini';
  if (sisa === 1) return 'besok';
  return `${sisa} hari lagi`;
}

/**
 * Merakit digest harian.
 *
 * Mengembalikan **null saat tidak ada yang perlu dilaporkan** — pesan
 * "tidak ada apa-apa" setiap pagi adalah cara tercepat membuat orang berhenti
 * membaca pengingat. Pemanggil memperlakukan null sebagai "jangan kirim".
 */
export function pesanHarian(data: DataHarian, acuan: string): string | null {
  const task = data.task
    .map((t) => ({ ...t, sisa: t.dueDate ? selisihHari(acuan, t.dueDate) : null }))
    .filter((t): t is TaskReminder & { sisa: number } => t.sisa !== null && t.sisa <= AMBANG_TASK_HARI)
    .sort((a, b) => a.sisa - b.sisa);

  const bayar = data.pembayaran
    .map((p) => ({ ...p, sisa: selisihHari(acuan, p.jatuhTempo) }))
    .filter((p): p is BayarReminder & { sisa: number } => p.sisa !== null && p.sisa <= AMBANG_BAYAR_HARI)
    .sort((a, b) => a.sisa - b.sisa);

  if (task.length === 0 && bayar.length === 0) return null;

  const baris: string[] = ['*Rencana Kita* — pengingat hari ini'];

  const mundur = data.tanggalResepsi ? selisihHari(acuan, data.tanggalResepsi) : null;
  if (mundur !== null && mundur >= 0) {
    baris.push(`_${mundur} hari menuju resepsi._`);
  }

  if (bayar.length > 0) {
    const total = bayar.reduce((n, p) => n + p.jumlah, 0);
    baris.push('', `💰 *Pembayaran* — ${rupiahRingkas(total)}`);
    for (const p of bayar) {
      baris.push(
        `• ${LABEL_BAYAR[p.jenis]} ${p.namaItem} — ${rupiahRingkas(p.jumlah)}, ${frasaHari(p.sisa)} (${tanggalPendek(p.jatuhTempo)})`,
      );
    }
  }

  if (task.length > 0) {
    baris.push('', `✅ *Task* — ${task.length} perlu diurus`);
    for (const t of task) {
      const siapa = t.assignee === 'berdua' ? '' : ` — ${LABEL_SIAPA[t.assignee]}`;
      baris.push(`• ${t.judul} (${frasaHari(t.sisa)})${siapa}`);
    }
  }

  return baris.join('\n');
}

export interface DataMingguan {
  tanggalResepsi: string | null;
  taskSelesai: number;
  taskTotal: number;
  taskTelat: number;
  totalBudget: number;
  totalKomitmen: number;
  /** Pembayaran yang jatuh tempo 7 hari ke depan. */
  bayarMingguIni: BayarReminder[];
  bayarLewatTempo: number;
}

/**
 * Merakit ringkasan mingguan.
 *
 * Berbeda dari digest harian, ini **selalu mengirim**: laporan progres yang
 * hanya datang saat ada masalah membuat diamnya jadi ambigu — tidak ada yang
 * perlu dikejar, atau reminder-nya mati?
 */
export function pesanMingguan(data: DataMingguan, acuan: string): string {
  const baris: string[] = ['*Rencana Kita* — ringkasan minggu ini'];

  const mundur = data.tanggalResepsi ? selisihHari(acuan, data.tanggalResepsi) : null;
  if (mundur === null) {
    baris.push('_Tanggal resepsi belum ditentukan._');
  } else if (mundur >= 0) {
    baris.push(`_${mundur} hari menuju resepsi (${tanggalPendek(data.tanggalResepsi!)})._`);
  } else {
    baris.push(`_Resepsi sudah lewat ${Math.abs(mundur)} hari lalu._`);
  }

  const persen =
    data.taskTotal > 0 ? Math.round((data.taskSelesai / data.taskTotal) * 100) : 0;
  baris.push('', '📋 *Persiapan*', `• ${data.taskSelesai} dari ${data.taskTotal} task selesai (${persen}%)`);
  if (data.taskTelat > 0) baris.push(`• ${data.taskTelat} task lewat tempo`);

  baris.push('', '💰 *Budget*');
  if (data.totalBudget > 0) {
    const sisa = data.totalBudget - data.totalKomitmen;
    const pakai = Math.round((data.totalKomitmen / data.totalBudget) * 100);
    baris.push(
      `• Terpakai ${rupiahRingkas(data.totalKomitmen)} dari ${rupiahRingkas(data.totalBudget)} (${pakai}%)`,
      sisa < 0 ? `• *Lebih ${rupiahRingkas(-sisa)}*` : `• Sisa ${rupiahRingkas(sisa)}`,
    );
  } else {
    baris.push(`• Komitmen ${rupiahRingkas(data.totalKomitmen)} — total budget belum diisi`);
  }
  if (data.bayarLewatTempo > 0) {
    baris.push(`• *Lewat tempo ${rupiahRingkas(data.bayarLewatTempo)}*`);
  }

  if (data.bayarMingguIni.length > 0) {
    const total = data.bayarMingguIni.reduce((n, p) => n + p.jumlah, 0);
    baris.push('', `📅 *Jatuh tempo minggu depan* — ${rupiahRingkas(total)}`);
    for (const p of data.bayarMingguIni) {
      baris.push(
        `• ${LABEL_BAYAR[p.jenis]} ${p.namaItem} — ${rupiahRingkas(p.jumlah)} (${tanggalPendek(p.jatuhTempo)})`,
      );
    }
  } else {
    baris.push('', '📅 Tidak ada pembayaran jatuh tempo minggu depan.');
  }

  return baris.join('\n');
}

/** Pesan tombol "Kirim tes" di Pengaturan. */
export function pesanTes(nama: string): string {
  return [
    '*Rencana Kita* — tes koneksi',
    '',
    `Halo ${nama || 'kamu'}, kalau pesan ini sampai berarti reminder WhatsApp sudah aktif.`,
  ].join('\n');
}
