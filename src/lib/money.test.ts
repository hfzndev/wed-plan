import { describe, it, expect } from 'vitest';
import { rupiah, angka, rupiahRingkas, parseRupiah, persen } from './money';

/** Intl memakai NBSP di beberapa posisi; normalkan supaya assert-nya terbaca. */
const n = (s: string) => s.replace(/ /g, ' ');

describe('rupiah', () => {
  it('memformat dengan pemisah ribuan Indonesia', () => {
    expect(n(rupiah(12_500_000))).toBe('Rp 12.500.000');
  });

  it('tidak menampilkan sen', () => {
    expect(n(rupiah(1))).toBe('Rp 1');
    expect(n(rupiah(0))).toBe('Rp 0');
  });

  it('menangani angka negatif', () => {
    expect(n(rupiah(-500_000))).toContain('500.000');
  });
});

describe('angka', () => {
  it('memformat tanpa label mata uang', () => {
    expect(angka(200_000_000)).toBe('200.000.000');
  });
});

describe('rupiahRingkas', () => {
  it('memakai satu desimal, tidak membulatkan ke atas', () => {
    // Regresi: pernah menampilkan "Rp 2 jt" untuk 1,5 juta.
    expect(n(rupiahRingkas(1_500_000))).toBe('Rp 1,5 jt');
    expect(n(rupiahRingkas(13_500_000))).toBe('Rp 13,5 jt');
  });

  it('membuang desimal nol', () => {
    expect(n(rupiahRingkas(30_000_000))).toBe('Rp 30 jt');
    expect(n(rupiahRingkas(2_000_000_000))).toBe('Rp 2 M');
  });

  it('memakai satuan yang benar per rentang', () => {
    expect(n(rupiahRingkas(1_200_000_000))).toBe('Rp 1,2 M');
    expect(n(rupiahRingkas(250_000))).toBe('Rp 250 rb');
  });

  it('menulis penuh di bawah seribu supaya tidak ambigu', () => {
    expect(n(rupiahRingkas(750))).toBe('Rp 750');
  });

  it('mempertahankan tanda negatif', () => {
    expect(n(rupiahRingkas(-5_000_000))).toBe('-Rp 5 jt');
  });

  it('nol tetap nol', () => {
    expect(n(rupiahRingkas(0))).toBe('Rp 0');
  });
});

describe('parseRupiah', () => {
  it('membaca angka berformat titik', () => {
    expect(parseRupiah('12.500.000')).toBe(12_500_000);
  });

  it('membaca angka polos', () => {
    expect(parseRupiah('12500000')).toBe(12_500_000);
  });

  it('mengabaikan label dan spasi', () => {
    expect(parseRupiah('Rp 12.500.000')).toBe(12_500_000);
  });

  it('mengembalikan 0 untuk input kosong atau tanpa digit', () => {
    expect(parseRupiah('')).toBe(0);
    expect(parseRupiah('abc')).toBe(0);
    expect(parseRupiah('-')).toBe(0);
  });

  it('bolak-balik dengan angka() tetap utuh', () => {
    expect(parseRupiah(angka(87_650_000))).toBe(87_650_000);
  });
});

describe('persen', () => {
  it('membulatkan ke bilangan bulat', () => {
    expect(persen(30, 103)).toBe(29);
    expect(persen(50, 100)).toBe(50);
  });

  it('mengembalikan 0 kalau total nol atau negatif', () => {
    expect(persen(10, 0)).toBe(0);
    expect(persen(10, -5)).toBe(0);
  });

  it('boleh melebihi 100 saat kelebihan budget', () => {
    expect(persen(150, 100)).toBe(150);
  });
});
