import { persen } from './money';
import { selisihHari, hariIni } from './timeline';

export interface ItemHitung {
  kategori: string;
  tipe: 'lumpsum' | 'per_pax';
  hargaSatuan: number;
  qty: number;
  aktual: number | null;
}

/**
 * Estimasi satu item.
 *
 * Item per_pax sengaja tidak menyimpan totalnya di database — totalnya selalu
 * diturunkan dari `targetTamu` saat render. Jadi mengubah target tamu satu kali
 * di Pengaturan langsung memperbarui seluruh biaya katering tanpa mengedit item.
 */
export function estimasiItem(item: ItemHitung, targetTamu: number): number {
  if (item.tipe === 'per_pax') return item.hargaSatuan * Math.max(0, targetTamu);
  return item.hargaSatuan * item.qty;
}

/** Angka yang dipakai untuk menghitung sisa dana: aktual kalau sudah ada, kalau belum pakai estimasi. */
export function komitmenItem(item: ItemHitung, targetTamu: number): number {
  return item.aktual ?? estimasiItem(item, targetTamu);
}

export interface BarisKategori {
  kategori: string;
  estimasi: number;
  aktual: number;
  komitmen: number;
  jumlahItem: number;
}

export interface RingkasanBudget {
  totalEstimasi: number;
  totalAktual: number;
  totalKomitmen: number;
  totalBudget: number;
  sisa: number;
  /** Persentase komitmen terhadap total budget. Bisa lebih dari 100. */
  persenTerpakai: number;
  /** Riset: katering wajar di 40–60% total. Di luar itu layak diperiksa ulang. */
  persenKatering: number;
  perKategori: BarisKategori[];
}

export function ringkasBudget(
  items: ItemHitung[],
  targetTamu: number,
  totalBudget: number,
): RingkasanBudget {
  const peta = new Map<string, BarisKategori>();
  let totalEstimasi = 0;
  let totalAktual = 0;
  let totalKomitmen = 0;

  for (const item of items) {
    const estimasi = estimasiItem(item, targetTamu);
    const aktual = item.aktual ?? 0;
    const komitmen = komitmenItem(item, targetTamu);

    totalEstimasi += estimasi;
    totalAktual += aktual;
    totalKomitmen += komitmen;

    const baris = peta.get(item.kategori) ?? {
      kategori: item.kategori,
      estimasi: 0,
      aktual: 0,
      komitmen: 0,
      jumlahItem: 0,
    };
    baris.estimasi += estimasi;
    baris.aktual += aktual;
    baris.komitmen += komitmen;
    baris.jumlahItem += 1;
    peta.set(item.kategori, baris);
  }

  const perKategori = [...peta.values()].sort((a, b) => b.komitmen - a.komitmen);
  const katering = peta.get('katering')?.komitmen ?? 0;

  return {
    totalEstimasi,
    totalAktual,
    totalKomitmen,
    totalBudget,
    sisa: totalBudget - totalKomitmen,
    persenTerpakai: persen(totalKomitmen, totalBudget),
    persenKatering: persen(katering, totalKomitmen),
    perKategori,
  };
}

export interface PembayaranHitung {
  jumlah: number;
  jatuhTempo: string;
  status: 'belum' | 'lunas';
}

export interface RingkasanPembayaran {
  totalLunas: number;
  totalBelum: number;
  /** Belum dibayar dan tanggalnya sudah lewat. */
  lewatTempo: number;
  /** Belum dibayar, jatuh tempo dalam 30 hari ke depan. */
  jatuhTempoDekat: number;
}

export function ringkasPembayaran(
  pembayaran: PembayaranHitung[],
  acuan: string = hariIni(),
): RingkasanPembayaran {
  let totalLunas = 0;
  let totalBelum = 0;
  let lewatTempo = 0;
  let jatuhTempoDekat = 0;

  for (const p of pembayaran) {
    if (p.status === 'lunas') {
      totalLunas += p.jumlah;
      continue;
    }
    totalBelum += p.jumlah;
    const sisa = selisihHari(acuan, p.jatuhTempo);
    if (sisa === null) continue;
    if (sisa < 0) lewatTempo += p.jumlah;
    else if (sisa <= 30) jatuhTempoDekat += p.jumlah;
  }

  return { totalLunas, totalBelum, lewatTempo, jatuhTempoDekat };
}
