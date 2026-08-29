import { describe, it, expect } from 'vitest';
import {
  pesanHarian,
  pesanMingguan,
  pesanTes,
  AMBANG_TASK_HARI,
  AMBANG_BAYAR_HARI,
  type DataHarian,
  type DataMingguan,
} from './pesan-reminder';

const ACUAN = '2026-08-28';

const kosong: DataHarian = { tanggalResepsi: '2027-05-15', task: [], pembayaran: [] };

const task = (judul: string, dueDate: string | null, assignee: TaskSiapa = 'berdua') => ({
  judul,
  dueDate,
  assignee,
});
type TaskSiapa = 'pria' | 'wanita' | 'berdua';

const bayar = (namaItem: string, jatuhTempo: string, jumlah = 5_000_000) => ({
  namaItem,
  jenis: 'dp' as const,
  jumlah,
  jatuhTempo,
});

describe('pesanHarian', () => {
  it('mengembalikan null saat tidak ada yang perlu dilaporkan', () => {
    // Diam lebih baik daripada "tidak ada apa-apa" tiap pagi — itu yang membuat
    // orang berhenti membaca pengingat.
    expect(pesanHarian(kosong, ACUAN)).toBeNull();
  });

  it('mengembalikan null saat semua item masih jauh dari ambang', () => {
    const data: DataHarian = {
      ...kosong,
      task: [task('Masih lama', '2026-12-01')],
      pembayaran: [bayar('Nanti', '2026-12-01')],
    };
    expect(pesanHarian(data, ACUAN)).toBeNull();
  });

  it('memuat task yang telat', () => {
    const pesan = pesanHarian({ ...kosong, task: [task('Bayar DP venue', '2026-08-25')] }, ACUAN);
    expect(pesan).toContain('Bayar DP venue');
    expect(pesan).toContain('telat 3 hari');
  });

  it('memakai frasa yang benar untuk hari ini dan besok', () => {
    const pesan = pesanHarian(
      { ...kosong, task: [task('A', ACUAN), task('B', '2026-08-29')] },
      ACUAN,
    );
    expect(pesan).toContain('hari ini');
    expect(pesan).toContain('besok');
  });

  it('menghormati ambang task, batasnya inklusif', () => {
    const tepat = pesanHarian({ ...kosong, task: [task('Tepat', '2026-08-31')] }, ACUAN); // +3
    const lewat = pesanHarian({ ...kosong, task: [task('Lewat', '2026-09-01')] }, ACUAN); // +4
    expect(AMBANG_TASK_HARI).toBe(3);
    expect(tepat).toContain('Tepat');
    expect(lewat).toBeNull();
  });

  it('memberi pembayaran ancang-ancang lebih panjang daripada task', () => {
    const data: DataHarian = { ...kosong, pembayaran: [bayar('Katering', '2026-09-04')] }; // +7
    expect(AMBANG_BAYAR_HARI).toBe(7);
    expect(pesanHarian(data, ACUAN)).toContain('Katering');
    // Hari ke-8 sudah di luar jangkauan.
    expect(pesanHarian({ ...kosong, pembayaran: [bayar('X', '2026-09-05')] }, ACUAN)).toBeNull();
  });

  it('menjumlahkan nominal pembayaran di judul bagiannya', () => {
    const data: DataHarian = {
      ...kosong,
      pembayaran: [bayar('A', '2026-08-30', 9_000_000), bayar('B', '2026-08-31', 3_000_000)],
    };
    expect(pesanHarian(data, ACUAN)).toContain('Rp 12 jt');
  });

  it('mengurutkan dari yang paling mendesak', () => {
    const pesan = pesanHarian(
      { ...kosong, task: [task('Nanti', '2026-08-30'), task('Telat', '2026-08-26')] },
      ACUAN,
    )!;
    expect(pesan.indexOf('Telat')).toBeLessThan(pesan.indexOf('Nanti'));
  });

  it('menyebut penanggung jawab hanya kalau bukan berdua', () => {
    const berdua = pesanHarian({ ...kosong, task: [task('X', ACUAN, 'berdua')] }, ACUAN)!;
    const pria = pesanHarian({ ...kosong, task: [task('Y', ACUAN, 'pria')] }, ACUAN)!;
    expect(berdua).not.toContain('— berdua');
    expect(pria).toContain('— pria');
  });

  it('melewatkan task yang belum punya jatuh tempo', () => {
    expect(pesanHarian({ ...kosong, task: [task('Belum terjadwal', null)] }, ACUAN)).toBeNull();
  });

  it('menyertakan hitung mundur resepsi', () => {
    const pesan = pesanHarian({ ...kosong, task: [task('X', ACUAN)] }, ACUAN)!;
    expect(pesan).toContain('260 hari menuju resepsi');
  });

  it('tidak menyebut hitung mundur kalau tanggal belum diisi', () => {
    const pesan = pesanHarian(
      { tanggalResepsi: null, task: [task('X', ACUAN)], pembayaran: [] },
      ACUAN,
    )!;
    expect(pesan).not.toContain('menuju resepsi');
  });
});

describe('pesanMingguan', () => {
  const dasar: DataMingguan = {
    tanggalResepsi: '2027-05-15',
    taskSelesai: 12,
    taskTotal: 64,
    taskTelat: 3,
    totalBudget: 200_000_000,
    totalKomitmen: 103_000_000,
    bayarMingguIni: [],
    bayarLewatTempo: 0,
  };

  it('selalu mengirim, bahkan saat tidak ada apa-apa', () => {
    // Beda dari harian: diam pada laporan progres jadi ambigu — tidak ada yang
    // perlu dikejar, atau reminder-nya yang mati?
    const pesan = pesanMingguan(
      { ...dasar, taskTelat: 0, bayarMingguIni: [], bayarLewatTempo: 0 },
      ACUAN,
    );
    expect(pesan).toContain('ringkasan minggu ini');
  });

  it('menghitung persentase progres', () => {
    expect(pesanMingguan(dasar, ACUAN)).toContain('12 dari 64 task selesai (19%)');
  });

  it('menyebut task telat hanya kalau ada', () => {
    expect(pesanMingguan(dasar, ACUAN)).toContain('3 task lewat tempo');
    expect(pesanMingguan({ ...dasar, taskTelat: 0 }, ACUAN)).not.toContain('lewat tempo');
  });

  it('menampilkan sisa budget', () => {
    const pesan = pesanMingguan(dasar, ACUAN);
    expect(pesan).toContain('Rp 103 jt');
    expect(pesan).toContain('Sisa Rp 97 jt');
  });

  it('menandai kelebihan budget, bukan sisa negatif', () => {
    const pesan = pesanMingguan({ ...dasar, totalKomitmen: 250_000_000 }, ACUAN);
    expect(pesan).toContain('Lebih Rp 50 jt');
    expect(pesan).not.toContain('Sisa');
  });

  it('tidak membagi dengan nol saat total budget belum diisi', () => {
    const pesan = pesanMingguan({ ...dasar, totalBudget: 0 }, ACUAN);
    expect(pesan).toContain('total budget belum diisi');
    expect(pesan).not.toContain('NaN');
    expect(pesan).not.toContain('Infinity');
  });

  it('menyatakan dengan jelas kalau tidak ada pembayaran minggu depan', () => {
    expect(pesanMingguan(dasar, ACUAN)).toContain('Tidak ada pembayaran jatuh tempo');
  });

  it('merinci pembayaran minggu depan', () => {
    const pesan = pesanMingguan(
      { ...dasar, bayarMingguIni: [bayar('Dekorasi', '2026-09-02', 25_000_000)] },
      ACUAN,
    );
    expect(pesan).toContain('Dekorasi');
    expect(pesan).toContain('2 Sep 2026');
  });

  it('menangani tanggal resepsi yang belum diisi', () => {
    const pesan = pesanMingguan({ ...dasar, tanggalResepsi: null }, ACUAN);
    expect(pesan).toContain('belum ditentukan');
  });

  it('menangani resepsi yang sudah lewat', () => {
    const pesan = pesanMingguan({ ...dasar, tanggalResepsi: '2026-08-01' }, ACUAN);
    expect(pesan).toContain('sudah lewat 27 hari');
  });
});

describe('pesanTes', () => {
  it('menyapa dengan nama', () => {
    expect(pesanTes('Hafiz')).toContain('Halo Hafiz');
  });

  it('tetap wajar tanpa nama', () => {
    expect(pesanTes('')).toContain('Halo kamu');
  });
});
