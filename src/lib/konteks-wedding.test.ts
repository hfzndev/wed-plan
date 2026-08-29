import { describe, it, expect } from 'vitest';
import {
  formatSnapshot,
  systemPrompt,
  BATAS_KARAKTER,
  type SnapshotData,
} from './konteks-wedding';

const dasar: SnapshotData = {
  namaPria: 'Hafiz',
  namaWanita: 'Vira',
  tanggalAkad: '2027-05-14',
  tanggalResepsi: '2027-05-15',
  venueAkad: 'KUA Kecamatan',
  venueResepsi: 'Gedung Serbaguna',
  sisaHariResepsi: 260,
  targetTamu: 300,

  totalBudget: 200_000_000,
  totalEstimasi: 108_000_000,
  totalKomitmen: 103_000_000,
  persenKatering: 35,
  perKategori: [
    { kategori: 'katering', komitmen: 36_000_000, jumlahItem: 1 },
    { kategori: 'venue', komitmen: 40_000_000, jumlahItem: 1 },
  ],

  bayarLunas: 9_000_000,
  bayarBelum: 21_000_000,
  bayarLewatTempo: 5_000_000,

  taskSelesai: 12,
  taskTotal: 64,
  taskTelat: 20,
  perFase: [
    { fase: 'pra', selesai: 10, total: 10, telat: 0 },
    { fase: 't12_11', selesai: 0, total: 3, telat: 3 },
    { fase: 'pasca', selesai: 0, total: 0, telat: 0 },
  ],

  vendor: [{ nama: 'Dekorasi Sekar Ayu', kategori: 'dekorasi', status: 'nego', hargaPenawaran: 25_000_000 }],

  dokumenSelesai: 0,
  dokumenTotal: 23,

  seserahanTotal: 13_500_000,
  seserahanDibeli: 0,
  seserahanJumlah: 2,
};

describe('formatSnapshot', () => {
  it('memuat nominal budget yang sebenarnya', () => {
    const s = formatSnapshot(dasar);
    expect(s).toContain('Rp 200.000.000');
    expect(s).toContain('Rp 103.000.000');
  });

  it('menghitung persentase terpakai dan sisa dana', () => {
    const s = formatSnapshot(dasar);
    expect(s).toContain('Terpakai 52%');
    expect(s).toContain('sisa Rp 97.000.000');
  });

  it('menandai kelebihan budget dengan tegas, bukan angka negatif', () => {
    const s = formatSnapshot({ ...dasar, totalKomitmen: 250_000_000 });
    expect(s).toContain('KELEBIHAN Rp 50.000.000');
  });

  it('menyertakan rentang wajar katering supaya model punya patokan', () => {
    expect(formatSnapshot(dasar)).toContain('40-60%');
  });

  it('menyatakan data kosong secara eksplisit, bukan menampilkan nol', () => {
    // Ini yang mencegah model menganalisa Rp 0 seolah itu keputusan sadar.
    const s = formatSnapshot({ ...dasar, totalBudget: 0, targetTamu: 0, tanggalResepsi: null });
    expect(s).toContain('Total budget: BELUM DIISI');
    expect(s).toContain('Target tamu: BELUM DIISI');
    expect(s).toContain('TANGGAL BELUM DITENTUKAN');
  });

  it('menyebut sisa hari menuju resepsi', () => {
    expect(formatSnapshot(dasar)).toContain('260 hari lagi');
  });

  it('menyatakan resepsi yang sudah lewat', () => {
    const s = formatSnapshot({ ...dasar, sisaHariResepsi: -5 });
    expect(s).toContain('sudah lewat 5 hari');
  });

  it('memakai label kategori berbahasa Indonesia, bukan kode mentah', () => {
    const s = formatSnapshot(dasar);
    expect(s).toContain('Katering');
    expect(s).toContain('Venue / Gedung');
  });

  it('menyembunyikan fase yang tidak punya task sama sekali', () => {
    const s = formatSnapshot(dasar);
    expect(s).toContain('12–11 bulan sebelum');
    expect(s).not.toContain('Setelah acara');
  });

  it('menyebutkan pembayaran lewat tempo', () => {
    expect(formatSnapshot(dasar)).toContain('LEWAT TEMPO: Rp 5.000.000');
  });

  it('mencantumkan vendor beserta status dan harganya', () => {
    const s = formatSnapshot(dasar);
    expect(s).toContain('Dekorasi Sekar Ayu');
    expect(s).toContain('Nego');
    expect(s).toContain('Rp 25.000.000');
  });

  it('menyatakan dengan jelas saat belum ada vendor atau item budget', () => {
    const s = formatSnapshot({ ...dasar, vendor: [], perKategori: [] });
    expect(s).toContain('Belum ada vendor tercatat');
    expect(s).toContain('Belum ada satu pun item budget');
  });

  it('tidak pernah menghasilkan NaN walau semua nol', () => {
    const nol: SnapshotData = {
      ...dasar,
      totalBudget: 0,
      totalEstimasi: 0,
      totalKomitmen: 0,
      persenKatering: 0,
      perKategori: [],
      taskTotal: 0,
      taskSelesai: 0,
      perFase: [],
      vendor: [],
      dokumenTotal: 0,
      dokumenSelesai: 0,
      seserahanJumlah: 0,
      seserahanTotal: 0,
      seserahanDibeli: 0,
    };
    const s = formatSnapshot(nol);
    expect(s).not.toContain('NaN');
    expect(s).not.toContain('Infinity');
    expect(s).not.toContain('undefined');
  });

  it('dipotong saat data membengkak, dan memberi tahu bahwa dipotong', () => {
    const banyak = Array.from({ length: 500 }, (_, i) => ({
      nama: `Vendor dengan nama yang panjang sekali nomor ${i}`,
      kategori: 'dekorasi',
      status: 'shortlist',
      hargaPenawaran: 25_000_000,
    }));
    const s = formatSnapshot({ ...dasar, vendor: banyak });
    expect(s.length).toBeLessThanOrEqual(BATAS_KARAKTER + 120);
    expect(s).toContain('Data dipotong');
  });

  it('memotong di batas baris, tidak di tengah angka', () => {
    const banyak = Array.from({ length: 500 }, (_, i) => ({
      nama: `Vendor ${i}`,
      kategori: 'dekorasi',
      status: 'shortlist',
      hargaPenawaran: 25_000_000,
    }));
    const s = formatSnapshot({ ...dasar, vendor: banyak });
    const isi = s.split('\n\n[Data dipotong')[0];
    // Baris terakhir yang tersisa harus utuh — diakhiri nominal lengkap.
    expect(isi.split('\n').at(-1)).toMatch(/Rp 25\.000\.000$/);
  });
});

describe('systemPrompt', () => {
  it('menyisipkan snapshot apa adanya', () => {
    const p = systemPrompt('=== DATA UJI ===');
    expect(p).toContain('=== DATA UJI ===');
  });

  it('melarang mengarang saat data kosong', () => {
    const p = systemPrompt('');
    expect(p).toContain('JANGAN mengarang');
  });

  it('menyatakan AI tidak bisa mengubah data', () => {
    expect(systemPrompt('')).toContain('tidak bisa mengubah data');
  });
});
