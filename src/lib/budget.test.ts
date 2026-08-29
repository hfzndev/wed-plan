import { describe, it, expect } from 'vitest';
import {
  estimasiItem,
  komitmenItem,
  ringkasBudget,
  ringkasPembayaran,
  type ItemHitung,
} from './budget';

const lumpsum = (kategori: string, harga: number, qty = 1, aktual: number | null = null): ItemHitung => ({
  kategori,
  tipe: 'lumpsum',
  hargaSatuan: harga,
  qty,
  aktual,
});

const perPax = (kategori: string, harga: number, aktual: number | null = null): ItemHitung => ({
  kategori,
  tipe: 'per_pax',
  hargaSatuan: harga,
  qty: 1,
  aktual,
});

describe('estimasiItem', () => {
  it('lumpsum dikali qty, target tamu tidak berpengaruh', () => {
    expect(estimasiItem(lumpsum('souvenir', 15_000, 4), 250)).toBe(60_000);
    expect(estimasiItem(lumpsum('souvenir', 15_000, 4), 900)).toBe(60_000);
  });

  it('per_pax dikali target tamu, qty diabaikan', () => {
    expect(estimasiItem(perPax('katering', 120_000), 250)).toBe(30_000_000);
  });

  it('per_pax ikut naik saat target tamu naik', () => {
    const item = perPax('katering', 120_000);
    expect(estimasiItem(item, 250)).toBe(30_000_000);
    expect(estimasiItem(item, 300)).toBe(36_000_000);
  });

  it('target tamu negatif diperlakukan sebagai nol, bukan estimasi negatif', () => {
    expect(estimasiItem(perPax('katering', 120_000), -5)).toBe(0);
  });
});

describe('komitmenItem', () => {
  it('memakai aktual begitu terisi', () => {
    expect(komitmenItem(perPax('katering', 120_000, 28_000_000), 250)).toBe(28_000_000);
  });

  it('aktual nol tetap dihormati, tidak jatuh balik ke estimasi', () => {
    expect(komitmenItem(lumpsum('lain', 500_000, 1, 0), 250)).toBe(0);
  });

  it('memakai estimasi selama aktual masih kosong', () => {
    expect(komitmenItem(lumpsum('cincin', 12_000_000), 250)).toBe(12_000_000);
  });
});

describe('ringkasBudget', () => {
  const items = [
    perPax('katering', 120_000),
    lumpsum('venue', 45_000_000, 1, 40_000_000),
    lumpsum('dekorasi', 25_000_000),
    lumpsum('mua', 8_000_000),
  ];

  it('menjumlahkan estimasi, aktual, dan komitmen', () => {
    const r = ringkasBudget(items, 250, 200_000_000);
    expect(r.totalEstimasi).toBe(30_000_000 + 45_000_000 + 25_000_000 + 8_000_000);
    expect(r.totalAktual).toBe(40_000_000);
    expect(r.totalKomitmen).toBe(30_000_000 + 40_000_000 + 25_000_000 + 8_000_000);
  });

  it('sisa dana dihitung dari komitmen, bukan estimasi mentah', () => {
    const r = ringkasBudget(items, 250, 200_000_000);
    expect(r.sisa).toBe(200_000_000 - 103_000_000);
  });

  it('sisa bisa negatif kalau kelebihan', () => {
    expect(ringkasBudget(items, 250, 50_000_000).sisa).toBe(-53_000_000);
  });

  it('total katering ikut naik saat target tamu naik tanpa mengedit item', () => {
    const a = ringkasBudget(items, 250, 200_000_000);
    const b = ringkasBudget(items, 300, 200_000_000);
    expect(b.totalKomitmen - a.totalKomitmen).toBe(6_000_000);
  });

  it('mengelompokkan per kategori, terbesar di atas', () => {
    const r = ringkasBudget(items, 250, 200_000_000);
    expect(r.perKategori.map((k) => k.kategori)).toEqual(['venue', 'katering', 'dekorasi', 'mua']);
    expect(r.perKategori[0].jumlahItem).toBe(1);
  });

  it('menggabungkan beberapa item dalam kategori yang sama', () => {
    const r = ringkasBudget([lumpsum('busana', 5_000_000), lumpsum('busana', 3_000_000)], 250, 0);
    expect(r.perKategori).toHaveLength(1);
    expect(r.perKategori[0].komitmen).toBe(8_000_000);
    expect(r.perKategori[0].jumlahItem).toBe(2);
  });

  it('persen katering dihitung terhadap total komitmen', () => {
    const r = ringkasBudget(items, 250, 200_000_000);
    expect(r.persenKatering).toBe(29); // 30jt dari 103jt
  });

  it('tidak membagi dengan nol saat belum ada data', () => {
    const r = ringkasBudget([], 0, 0);
    expect(r.totalKomitmen).toBe(0);
    expect(r.persenTerpakai).toBe(0);
    expect(r.persenKatering).toBe(0);
    expect(r.perKategori).toEqual([]);
  });
});

describe('ringkasPembayaran', () => {
  const acuan = '2026-08-28';

  it('memisahkan lunas dan belum', () => {
    const r = ringkasPembayaran(
      [
        { jumlah: 10_000_000, jatuhTempo: '2026-07-01', status: 'lunas' },
        { jumlah: 5_000_000, jatuhTempo: '2026-09-01', status: 'belum' },
      ],
      acuan,
    );
    expect(r.totalLunas).toBe(10_000_000);
    expect(r.totalBelum).toBe(5_000_000);
  });

  it('menandai yang lewat tempo', () => {
    const r = ringkasPembayaran(
      [{ jumlah: 3_000_000, jatuhTempo: '2026-08-27', status: 'belum' }],
      acuan,
    );
    expect(r.lewatTempo).toBe(3_000_000);
    expect(r.jatuhTempoDekat).toBe(0);
  });

  it('jatuh tempo hari ini masuk kategori dekat, bukan lewat tempo', () => {
    const r = ringkasPembayaran([{ jumlah: 1_000_000, jatuhTempo: acuan, status: 'belum' }], acuan);
    expect(r.lewatTempo).toBe(0);
    expect(r.jatuhTempoDekat).toBe(1_000_000);
  });

  it('batas 30 hari inklusif, hari ke-31 tidak dihitung dekat', () => {
    const r = ringkasPembayaran(
      [
        { jumlah: 1_000_000, jatuhTempo: '2026-09-27', status: 'belum' }, // +30
        { jumlah: 2_000_000, jatuhTempo: '2026-09-28', status: 'belum' }, // +31
      ],
      acuan,
    );
    expect(r.jatuhTempoDekat).toBe(1_000_000);
    expect(r.totalBelum).toBe(3_000_000);
  });

  it('yang sudah lunas tidak pernah dihitung lewat tempo', () => {
    const r = ringkasPembayaran(
      [{ jumlah: 9_000_000, jatuhTempo: '2026-01-01', status: 'lunas' }],
      acuan,
    );
    expect(r.lewatTempo).toBe(0);
  });
});
