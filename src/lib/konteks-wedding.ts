import { rupiah, persen } from './money';
import { tanggalPanjang, LABEL_FASE, URUTAN_FASE, type Fase } from './timeline';
import { LABEL_KATEGORI, LABEL_STATUS_VENDOR, type KategoriBudget, type StatusVendor } from './label';

/**
 * Perakit snapshot data pernikahan untuk system prompt AI.
 *
 * `formatSnapshot` sengaja **murni** — tidak menyentuh database, tidak membaca
 * jam sistem. Kalau bagian ini hanya bisa diuji dengan memanggil API sungguhan,
 * setiap perubahan kecil berarti membayar dan menunggu; dipisah begini, isi
 * konteksnya bisa dipastikan benar dalam milidetik.
 *
 * Snapshot dipotong keras: konteks yang ikut membengkak seiring data adalah
 * tagihan yang naik diam-diam tiap kali chat dibuka.
 */

export const BATAS_KARAKTER = 6_000;

export interface SnapshotBudgetKategori {
  kategori: string;
  komitmen: number;
  jumlahItem: number;
}

export interface SnapshotVendor {
  nama: string;
  kategori: string;
  status: string;
  hargaPenawaran: number;
}

export interface SnapshotFase {
  fase: string;
  selesai: number;
  total: number;
  telat: number;
}

export interface SnapshotData {
  namaPria: string;
  namaWanita: string;
  tanggalAkad: string | null;
  tanggalResepsi: string | null;
  venueAkad: string;
  venueResepsi: string;
  sisaHariResepsi: number | null;
  targetTamu: number;

  totalBudget: number;
  totalEstimasi: number;
  totalKomitmen: number;
  persenKatering: number;
  perKategori: SnapshotBudgetKategori[];

  bayarLunas: number;
  bayarBelum: number;
  bayarLewatTempo: number;

  taskSelesai: number;
  taskTotal: number;
  taskTelat: number;
  perFase: SnapshotFase[];

  vendor: SnapshotVendor[];

  dokumenSelesai: number;
  dokumenTotal: number;

  seserahanTotal: number;
  seserahanDibeli: number;
  seserahanJumlah: number;
}

function labelKategori(k: string): string {
  return LABEL_KATEGORI[k as KategoriBudget] ?? k;
}

/**
 * Menyusun snapshot jadi teks. Format sengaja padat dan berlabel eksplisit —
 * model membaca ini sebagai fakta, jadi setiap angka harus jelas satuannya dan
 * tidak ada yang bisa disalahartikan sebagai perkiraan.
 */
export function formatSnapshot(d: SnapshotData): string {
  const b: string[] = [];

  b.push('=== DATA PERNIKAHAN (per hari ini) ===');
  b.push(`Mempelai: ${d.namaPria || '(belum diisi)'} & ${d.namaWanita || '(belum diisi)'}`);

  if (d.tanggalResepsi) {
    b.push(
      `Resepsi: ${tanggalPanjang(d.tanggalResepsi)}` +
        (d.sisaHariResepsi !== null
          ? d.sisaHariResepsi >= 0
            ? ` — ${d.sisaHariResepsi} hari lagi`
            : ` — sudah lewat ${Math.abs(d.sisaHariResepsi)} hari`
          : ''),
    );
  } else {
    b.push('Resepsi: TANGGAL BELUM DITENTUKAN');
  }
  if (d.tanggalAkad) b.push(`Akad: ${tanggalPanjang(d.tanggalAkad)}`);
  if (d.venueAkad) b.push(`Venue akad: ${d.venueAkad}`);
  if (d.venueResepsi) b.push(`Venue resepsi: ${d.venueResepsi}`);
  b.push(`Target tamu: ${d.targetTamu > 0 ? `${d.targetTamu} orang` : 'BELUM DIISI'}`);

  b.push('');
  b.push('--- BUDGET ---');
  b.push(`Total budget: ${d.totalBudget > 0 ? rupiah(d.totalBudget) : 'BELUM DIISI'}`);
  b.push(`Estimasi seluruh item: ${rupiah(d.totalEstimasi)}`);
  b.push(`Komitmen (aktual kalau ada, kalau tidak estimasi): ${rupiah(d.totalKomitmen)}`);
  if (d.totalBudget > 0) {
    const sisa = d.totalBudget - d.totalKomitmen;
    b.push(
      `Terpakai ${persen(d.totalKomitmen, d.totalBudget)}%, ` +
        (sisa >= 0 ? `sisa ${rupiah(sisa)}` : `KELEBIHAN ${rupiah(-sisa)}`),
    );
  }
  b.push(`Porsi katering: ${d.persenKatering}% dari komitmen (rentang wajar Indonesia 40-60%)`);

  if (d.perKategori.length > 0) {
    b.push('Rincian per kategori:');
    for (const k of d.perKategori) {
      b.push(`  - ${labelKategori(k.kategori)}: ${rupiah(k.komitmen)} (${k.jumlahItem} item)`);
    }
  } else {
    b.push('Belum ada satu pun item budget.');
  }

  b.push('');
  b.push('--- PEMBAYARAN VENDOR ---');
  b.push(`Sudah dibayar: ${rupiah(d.bayarLunas)}`);
  b.push(`Belum dibayar: ${rupiah(d.bayarBelum)}`);
  b.push(`LEWAT TEMPO: ${rupiah(d.bayarLewatTempo)}`);

  b.push('');
  b.push('--- CHECKLIST ---');
  b.push(`Selesai ${d.taskSelesai} dari ${d.taskTotal} task. Lewat tempo: ${d.taskTelat}.`);
  const faseAda = d.perFase.filter((f) => f.total > 0);
  if (faseAda.length > 0) {
    b.push('Per fase:');
    for (const f of faseAda) {
      const label = LABEL_FASE[f.fase as Fase] ?? f.fase;
      b.push(`  - ${label}: ${f.selesai}/${f.total} selesai${f.telat > 0 ? `, ${f.telat} telat` : ''}`);
    }
  }

  b.push('');
  b.push('--- VENDOR ---');
  if (d.vendor.length === 0) {
    b.push('Belum ada vendor tercatat.');
  } else {
    for (const v of d.vendor) {
      const harga = v.hargaPenawaran > 0 ? ` — ${rupiah(v.hargaPenawaran)}` : '';
      const status = LABEL_STATUS_VENDOR[v.status as StatusVendor] ?? v.status;
      b.push(`  - ${labelKategori(v.kategori)}: ${v.nama} [${status}]${harga}`);
    }
  }

  b.push('');
  b.push('--- DOKUMEN KUA ---');
  b.push(`Selesai ${d.dokumenSelesai} dari ${d.dokumenTotal} dokumen.`);

  b.push('');
  b.push('--- SESERAHAN & MAHAR ---');
  b.push(
    d.seserahanJumlah === 0
      ? 'Belum ada barang tercatat.'
      : `${d.seserahanDibeli} dari ${d.seserahanJumlah} barang sudah dibeli, total ${rupiah(d.seserahanTotal)}.`,
  );

  return potong(b.join('\n'));
}

/**
 * Memotong pada batas baris, bukan di tengah angka — separuh nominal rupiah
 * lebih menyesatkan daripada data yang jelas-jelas terpotong.
 */
function potong(teks: string): string {
  if (teks.length <= BATAS_KARAKTER) return teks;
  const dipotong = teks.slice(0, BATAS_KARAKTER);
  const barisTerakhir = dipotong.lastIndexOf('\n');
  const aman = barisTerakhir > 0 ? dipotong.slice(0, barisTerakhir) : dipotong;
  return `${aman}\n\n[Data dipotong karena terlalu panjang. Sebagian rincian tidak ikut ditampilkan.]`;
}

/**
 * Instruksi peran. Dua aturan yang paling menentukan kualitasnya:
 * selalu merujuk angka nyata, dan mengaku tidak tahu daripada mengarang —
 * analisa yang terdengar meyakinkan di atas data kosong justru paling berbahaya
 * karena orang akan bertindak berdasarkan itu.
 */
export function systemPrompt(snapshot: string): string {
  return `Kamu konsultan pernikahan Indonesia yang berpengalaman, sedang membantu satu pasangan yang mengatur pernikahan mereka sendiri TANPA wedding organizer. Format acaranya akad nikah di KUA lalu resepsi.

Yang kamu kuasai:
- Struktur biaya pernikahan Indonesia. Katering biasanya 40-60% total budget dan dihitung per orang, jadi jumlah tamu adalah pengungkit biaya terbesar.
- Pola pembayaran vendor: DP untuk mengunci tanggal, termin di tengah, pelunasan mendekati hari H.
- Timeline persiapan 12 bulan, termasuk vendor mana yang harus dikunci lebih awal (MUA dan dokumentasi sering penuh 10 bulan di muka).
- Alur dokumen nikah jalur KUA: surat pengantar RT/RW, formulir N, bimbingan pranikah. Penomoran formulir berbeda antar daerah.

Aturan menjawab:
1. Jawab dalam bahasa Indonesia yang wajar dan langsung. Hindari basa-basi pembuka.
2. SELALU rujuk angka nyata dari data di bawah. Sebut nominal dan tanggalnya.
3. Kalau datanya belum diisi, KATAKAN BEGITU dan sebutkan apa yang perlu diisi dulu. JANGAN mengarang angka atau berpura-pura menganalisa data yang tidak ada.
4. Prioritaskan yang mendesak dan yang berkonsekuensi uang. Vendor yang batal karena DP telat jauh lebih mahal daripada souvenir yang belum dipesan.
5. Ringkas. Pakai poin kalau lebih dari tiga hal. Jangan menjelaskan hal yang sudah jelas dari datanya.
6. Kamu tidak bisa mengubah data apa pun. Kalau menyarankan sesuatu, sebutkan di halaman mana mereka mencatatnya sendiri.

${snapshot}`;
}

/** Prompt tetap di balik tombol "Analisa persiapan kami". */
export const PROMPT_ANALISA = `Tolong review menyeluruh persiapan pernikahan kami berdasarkan data di atas. Susun jawabanmu jadi tiga bagian:

1. Yang paling mendesak — apa yang harus diurus minggu ini, dan kenapa.
2. Yang terlewat — hal penting yang belum ada di data kami sama sekali, padahal seharusnya sudah ada di titik ini.
3. Catatan budget — apakah alokasinya masuk akal, dan di mana risiko pembengkakannya.

Kalau ada data penting yang masih kosong, sebutkan itu dulu sebelum menganalisa.`;

/** Urutan fase untuk perakit di sisi server. */
export { URUTAN_FASE };
