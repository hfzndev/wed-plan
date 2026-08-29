import { describe, it, expect } from 'vitest';
import {
  OFFSET_FASE,
  offsetUntukFase,
  parseTanggal,
  selisihHari,
  hitungMundur,
  dueDateTask,
  lewatTempo,
  hariIni,
  tanggalPanjang,
  tanggalPendek,
} from './timeline';

describe('parseTanggal', () => {
  it('menerima format YYYY-MM-DD', () => {
    expect(parseTanggal('2026-09-12')).toEqual({ y: 2026, m: 9, d: 12 });
  });

  it('menolak format lain', () => {
    expect(parseTanggal('12/09/2026')).toBeNull();
    expect(parseTanggal('2026-9-12')).toBeNull();
    expect(parseTanggal('')).toBeNull();
  });

  it('menolak tanggal yang tidak ada, bukan menggulung ke bulan berikutnya', () => {
    expect(parseTanggal('2026-02-31')).toBeNull();
    expect(parseTanggal('2026-13-01')).toBeNull();
  });

  it('menerima 29 Februari di tahun kabisat', () => {
    expect(parseTanggal('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
    expect(parseTanggal('2026-02-29')).toBeNull();
  });
});

describe('selisihHari', () => {
  it('menghitung maju dan mundur', () => {
    expect(selisihHari('2026-09-01', '2026-09-12')).toBe(11);
    expect(selisihHari('2026-09-12', '2026-09-01')).toBe(-11);
    expect(selisihHari('2026-09-12', '2026-09-12')).toBe(0);
  });

  it('menyeberang tahun dengan benar', () => {
    expect(selisihHari('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('hitungMundur', () => {
  it('mengembalikan null saat tanggal belum ditentukan', () => {
    expect(hitungMundur(null)).toBeNull();
  });

  it('mengembalikan sisa hari dari tanggal acuan', () => {
    expect(hitungMundur('2026-09-12', '2026-09-01')).toBe(11);
  });

  it('negatif kalau tanggalnya sudah lewat', () => {
    expect(hitungMundur('2026-09-01', '2026-09-12')).toBe(-11);
  });
});

describe('dueDateTask', () => {
  const tanpaOverride = { offsetHari: 30, dueDateOverride: null };

  it('menghitung mundur dari tanggal resepsi', () => {
    expect(dueDateTask(tanpaOverride, '2026-09-12')).toBe('2026-08-13');
  });

  it('mengembalikan null selama tanggal resepsi belum diisi', () => {
    expect(dueDateTask(tanpaOverride, null)).toBeNull();
  });

  it('mengembalikan null untuk task tanpa offset, misalnya fase pra', () => {
    expect(dueDateTask({ offsetHari: null, dueDateOverride: null }, '2026-09-12')).toBeNull();
  });

  it('override manual selalu menang, bahkan tanpa tanggal resepsi', () => {
    const t = { offsetHari: 30, dueDateOverride: '2026-07-01' };
    expect(dueDateTask(t, '2026-09-12')).toBe('2026-07-01');
    expect(dueDateTask(t, null)).toBe('2026-07-01');
  });

  it('offset 0 berarti tepat di hari H', () => {
    expect(dueDateTask({ offsetHari: 0, dueDateOverride: null }, '2026-09-12')).toBe('2026-09-12');
  });

  it('menyeberang batas bulan dan tahun', () => {
    expect(dueDateTask({ offsetHari: 365, dueDateOverride: null }, '2027-01-05')).toBe('2026-01-05');
  });
});

describe('lewatTempo', () => {
  it('true kalau sudah lewat dan belum selesai', () => {
    expect(lewatTempo('2026-08-01', false, '2026-08-02')).toBe(true);
  });

  it('false kalau sudah selesai, walau tanggalnya lewat', () => {
    expect(lewatTempo('2026-08-01', true, '2026-08-02')).toBe(false);
  });

  it('false di hari jatuh tempo itu sendiri', () => {
    expect(lewatTempo('2026-08-02', false, '2026-08-02')).toBe(false);
  });

  it('false kalau tidak punya tanggal jatuh tempo', () => {
    expect(lewatTempo(null, false, '2026-08-02')).toBe(false);
  });
});

describe('hariIni', () => {
  it('memakai zona Asia/Jakarta, bukan UTC', () => {
    // 2026-08-27 18:30 UTC = 2026-08-28 01:30 WIB — sudah ganti hari di Jakarta.
    expect(hariIni(new Date('2026-08-27T18:30:00Z'))).toBe('2026-08-28');
  });
});

describe('format tanggal', () => {
  it('tanggalPanjang menyertakan nama hari dalam bahasa Indonesia', () => {
    expect(tanggalPanjang('2026-09-12')).toBe('Sabtu, 12 September 2026');
  });

  it('tanggalPendek memakai singkatan bulan', () => {
    expect(tanggalPendek('2026-09-12')).toBe('12 Sep 2026');
  });

  it('mengembalikan input apa adanya kalau tidak bisa diurai', () => {
    expect(tanggalPanjang('bukan-tanggal')).toBe('bukan-tanggal');
  });
});

describe('offsetUntukFase', () => {
  it('memberi offset wakil tiap fase bertanggal', () => {
    expect(offsetUntukFase('t12_11')).toBe(335);
    expect(offsetUntukFase('t5_3')).toBe(120);
    expect(offsetUntukFase('t1')).toBe(22);
  });

  it('hariH tepat di hari resepsi, bukan null', () => {
    // 0 dan null gampang tertukar; 0 berarti "hari itu juga".
    expect(offsetUntukFase('hariH')).toBe(0);
  });

  it('pra dan pasca tidak terikat tanggal', () => {
    expect(offsetUntukFase('pra')).toBeNull();
    expect(offsetUntukFase('pasca')).toBeNull();
  });

  it('fase tak dikenal null, bukan melempar error', () => {
    expect(offsetUntukFase('entah')).toBeNull();
    expect(offsetUntukFase('')).toBeNull();
  });

  it('urutannya menurun sesuai urutan fase', () => {
    // Kalau ada yang salah ketik, papan akan memindahkan task ke tanggal yang
    // justru lebih jauh dari hari H — ini yang menangkapnya.
    const bertanggal = ['t12_11', 't10_9', 't8_6', 't5_3', 't2', 't1', 't7hari', 'hariH'];
    const nilai = bertanggal.map((f) => offsetUntukFase(f)!);
    expect(nilai).toEqual([...nilai].sort((a, b) => b - a));
  });

  it('setiap fase punya entri, tidak ada yang terlewat', () => {
    expect(Object.keys(OFFSET_FASE)).toHaveLength(10);
  });
});

describe('pindah fase mengubah jatuh tempo', () => {
  const resepsi = '2027-05-15';

  it('dipindah ke fase lebih awal, tanggalnya benar-benar mundur', () => {
    const sebelum = dueDateTask(
      { offsetHari: offsetUntukFase('t5_3'), dueDateOverride: null },
      resepsi,
    );
    const sesudah = dueDateTask(
      { offsetHari: offsetUntukFase('t8_6'), dueDateOverride: null },
      resepsi,
    );
    expect(sebelum).toBe('2027-01-15');
    expect(sesudah).toBe('2026-10-17');
    expect(selisihHari(sesudah!, sebelum!)).toBeGreaterThan(0);
  });

  it('dipindah ke hariH jatuh tepat di tanggal resepsi', () => {
    expect(
      dueDateTask({ offsetHari: offsetUntukFase('hariH'), dueDateOverride: null }, resepsi),
    ).toBe(resepsi);
  });

  it('dipindah ke pra membuat task tanpa tanggal, bukan tanggal ngawur', () => {
    expect(
      dueDateTask({ offsetHari: offsetUntukFase('pra'), dueDateOverride: null }, resepsi),
    ).toBeNull();
  });

  it('task dengan tanggal dikunci manual tidak ikut bergeser', () => {
    // Aturan "override selalu menang" tidak boleh berubah gara-gara papan.
    const dikunci = { offsetHari: offsetUntukFase('t8_6'), dueDateOverride: '2027-03-01' };
    expect(dueDateTask(dikunci, resepsi)).toBe('2027-03-01');
  });
});
