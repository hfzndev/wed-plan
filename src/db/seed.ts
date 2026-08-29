import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users, settings, tasks, documents } from './schema';
import { TEMPLATE_TASKS, TEMPLATE_DOKUMEN } from './template';

const path = process.env.DATABASE_PATH ?? './data/wedplan.db';
mkdirSync(dirname(path), { recursive: true });

const client = createClient({ url: `file:${path}` });
const db = drizzle(client);

function wajib(nama: string): string {
  const nilai = process.env[nama];
  if (!nilai) {
    console.error(`\n${nama} belum diisi. Salin .env.example ke .env lalu isi kredensialnya.\n`);
    process.exit(1);
  }
  return nilai;
}

async function seedUsers() {
  const daftar = [
    {
      email: wajib('SEED_PRIA_EMAIL').toLowerCase(),
      password: wajib('SEED_PRIA_PASSWORD'),
      nama: process.env.SEED_PRIA_NAMA ?? 'Mempelai Pria',
      peran: 'pria' as const,
    },
    {
      email: wajib('SEED_WANITA_EMAIL').toLowerCase(),
      password: wajib('SEED_WANITA_PASSWORD'),
      nama: process.env.SEED_WANITA_NAMA ?? 'Mempelai Wanita',
      peran: 'wanita' as const,
    },
  ];

  for (const u of daftar) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const [ada] = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (ada) {
      // Menjalankan ulang seed adalah cara mengganti password yang lupa.
      await db.update(users).set({ passwordHash, nama: u.nama, peran: u.peran }).where(eq(users.id, ada.id));
      console.log(`  user diperbarui: ${u.email}`);
    } else {
      await db.insert(users).values({ email: u.email, nama: u.nama, peran: u.peran, passwordHash });
      console.log(`  user dibuat:     ${u.email}`);
    }
  }

  await peringatkanAkunAsing(daftar.map((u) => u.email));
}

/**
 * Mengganti email di .env membuat akun baru, bukan mengganti nama akun lama —
 * akun lama tetap bisa dipakai masuk. Aplikasi ini hanya untuk dua orang, jadi
 * setiap akun di luar .env harus terlihat, bukan mengendap diam-diam.
 */
async function peringatkanAkunAsing(emailDiEnv: string[]) {
  const semua = await db.select({ id: users.id, email: users.email }).from(users);
  const asing = semua.filter((u) => !emailDiEnv.includes(u.email));
  if (asing.length === 0) return;

  console.warn(`\n  PERHATIAN — ${asing.length} akun di database tidak ada di .env:`);
  for (const a of asing) console.warn(`    ${a.email}`);
  console.warn('  Akun ini masih bisa dipakai masuk. Hapus kalau bukan milik kalian:');
  console.warn(`    pnpm db:hapus-user <email>\n`);
}

async function seedSettings() {
  const [ada] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (ada) {
    console.log('  settings sudah ada, dilewati');
    return;
  }
  await db.insert(settings).values({
    id: 1,
    namaPria: process.env.SEED_PRIA_NAMA ?? '',
    namaWanita: process.env.SEED_WANITA_NAMA ?? '',
  });
  console.log('  settings dibuat');
}

async function seedTasks() {
  let dibuat = 0;
  for (const [i, t] of TEMPLATE_TASKS.entries()) {
    // Idempoten: judul + fase adalah identitas baris template.
    const [ada] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.judul, t.judul), eq(tasks.fase, t.fase), eq(tasks.dariTemplate, true)))
      .limit(1);
    if (ada) continue;

    await db.insert(tasks).values({
      judul: t.judul,
      deskripsi: t.deskripsi ?? '',
      kategori: t.kategori ?? '',
      fase: t.fase,
      offsetHari: t.offsetHari,
      assignee: t.assignee ?? 'berdua',
      sortOrder: i,
      dariTemplate: true,
    });
    dibuat += 1;
  }
  console.log(`  task template: ${dibuat} baru, ${TEMPLATE_TASKS.length - dibuat} sudah ada`);
}

async function seedDokumen() {
  let dibuat = 0;
  for (const [i, d] of TEMPLATE_DOKUMEN.entries()) {
    const [ada] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.nama, d.nama), eq(documents.pihak, d.pihak), eq(documents.dariTemplate, true)))
      .limit(1);
    if (ada) continue;

    await db.insert(documents).values({
      nama: d.nama,
      pihak: d.pihak,
      instansi: d.instansi ?? '',
      catatan: d.catatan ?? '',
      sortOrder: i,
      dariTemplate: true,
    });
    dibuat += 1;
  }
  console.log(`  dokumen template: ${dibuat} baru, ${TEMPLATE_DOKUMEN.length - dibuat} sudah ada`);
}

async function main() {
  console.log(`Seeding ${path}`);
  await seedUsers();
  await seedSettings();
  await seedTasks();
  await seedDokumen();
  client.close();
  console.log('Selesai.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
