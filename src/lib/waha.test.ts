import { describe, it, expect } from 'vitest';
import { toChatId, normalisasiNomor } from './waha';

describe('toChatId', () => {
  it('mengubah E.164 jadi chat id WAHA', () => {
    expect(toChatId('+628123456789')).toBe('628123456789@c.us');
  });

  it('menerima spasi di ujung', () => {
    expect(toChatId('  +628123456789  ')).toBe('628123456789@c.us');
  });

  it('menolak nomor tanpa tanda plus', () => {
    // Sengaja ketat: hanya menerima bentuk yang dihasilkan normalisasiNomor().
    // Menebak bentuk lain berisiko mengirim pesan ke orang asing.
    expect(toChatId('628123456789')).toBeNull();
    expect(toChatId('08123456789')).toBeNull();
  });

  it('menolak yang mengandung pemisah', () => {
    expect(toChatId('+62 812-3456-789')).toBeNull();
  });

  it('menolak yang terlalu pendek atau terlalu panjang', () => {
    expect(toChatId('+6281')).toBeNull();
    expect(toChatId(`+62${'8'.repeat(20)}`)).toBeNull();
  });

  it('menolak string kosong', () => {
    expect(toChatId('')).toBeNull();
  });
});

describe('normalisasiNomor', () => {
  it('menerima bentuk 08xx', () => {
    expect(normalisasiNomor('08123456789')).toBe('+628123456789');
  });

  it('menerima bentuk 628xx', () => {
    expect(normalisasiNomor('628123456789')).toBe('+628123456789');
  });

  it('menerima bentuk 8xx tanpa awalan', () => {
    expect(normalisasiNomor('8123456789')).toBe('+628123456789');
  });

  it('mengabaikan spasi, tanda hubung, dan kurung', () => {
    expect(normalisasiNomor('+62 812-3456-789')).toBe('+628123456789');
    expect(normalisasiNomor('(0812) 3456 789')).toBe('+628123456789');
  });

  it('menolak nomor yang tidak diawali 8 setelah kode negara', () => {
    // Nomor rumah dan layanan bukan tujuan WhatsApp.
    expect(normalisasiNomor('0217654321')).toBeNull();
  });

  it('menolak yang terlalu pendek', () => {
    expect(normalisasiNomor('0812345')).toBeNull();
  });

  it('menolak input kosong atau tanpa digit', () => {
    expect(normalisasiNomor('')).toBeNull();
    expect(normalisasiNomor('bukan nomor')).toBeNull();
  });

  it('hasilnya selalu bisa dipakai toChatId', () => {
    const e164 = normalisasiNomor('0812-3456-789')!;
    expect(toChatId(e164)).toBe('628123456789@c.us');
  });
});
