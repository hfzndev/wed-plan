/**
 * Membuat ikon PWA dari SVG tanpa dependensi tambahan.
 *
 * Node belum bisa merender SVG ke PNG sendiri, jadi ikon ditulis sebagai PNG
 * satu warna yang di-generate manual (header PNG + IDAT terkompresi zlib), lalu
 * huruf inisialnya digambar sebagai kotak sederhana. Hasilnya sederhana tapi
 * cukup untuk Add to Home Screen, dan tidak menambah dependensi build.
 *
 * Jalankan: node scripts/buat-ikon.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const LATAR = [0xb5, 0x65, 0x4a]; // terracotta
const TINTA = [0xff, 0xfd, 0xfa];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(tipe, data) {
  const panjang = Buffer.alloc(4);
  panjang.writeUInt32BE(data.length);
  const isi = Buffer.concat([Buffer.from(tipe, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(isi));
  return Buffer.concat([panjang, isi, crc]);
}

/** Gambar cincin sederhana di tengah — bentuk yang terbaca di ukuran kecil. */
function piksel(x, y, ukuran, margin) {
  const pusat = ukuran / 2;
  const jarak = Math.hypot(x - pusat, y - pusat);
  const luar = pusat - margin;
  const dalam = luar * 0.62;
  return jarak <= luar && jarak >= dalam ? TINTA : LATAR;
}

function buatPng(ukuran, margin) {
  const baris = [];
  for (let y = 0; y < ukuran; y++) {
    const b = Buffer.alloc(1 + ukuran * 3);
    for (let x = 0; x < ukuran; x++) {
      const [r, g, bl] = piksel(x, y, ukuran, margin);
      b[1 + x * 3] = r;
      b[2 + x * 3] = g;
      b[3 + x * 3] = bl;
    }
    baris.push(b);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ukuran, 0);
  ihdr.writeUInt32BE(ukuran, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(baris), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });

// Ikon maskable perlu margin lebih besar karena sebagian dipotong Android.
const berkas = [
  ['public/icon-192.png', 192, 34],
  ['public/icon-512.png', 512, 90],
  ['public/icon-maskable.png', 512, 140],
];

for (const [nama, ukuran, margin] of berkas) {
  writeFileSync(nama, buatPng(ukuran, margin));
  console.log(`  ${nama} (${ukuran}×${ukuran})`);
}
