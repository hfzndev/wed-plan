import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { users } from './schema';

const path = process.env.DATABASE_PATH ?? './data/wedplan.db';
const client = createClient({ url: `file:${path}` });
const db = drizzle(client);

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('\nPakai: pnpm db:hapus-user <email>\n');
    process.exit(1);
  }

  const semua = await db.select({ id: users.id, email: users.email }).from(users);
  const target = semua.find((u) => u.email === email);

  if (!target) {
    console.error(`\nAkun "${email}" tidak ada. Yang terdaftar:`);
    for (const u of semua) console.error(`  ${u.email}`);
    console.error('');
    process.exit(1);
  }

  // Tanpa akun tersisa tidak ada yang bisa masuk, dan tidak ada halaman signup
  // untuk memulihkannya — jalan keluarnya cuma menjalankan seed lagi.
  if (semua.length <= 1) {
    console.error('\nIni akun terakhir. Menghapusnya membuat aplikasi tidak bisa dimasuki.');
    console.error('Buat akun pengganti dulu lewat `pnpm db:seed`.\n');
    process.exit(1);
  }

  await db.delete(users).where(eq(users.id, target.id));
  client.close();
  console.log(`Akun "${email}" dihapus. Sisa ${semua.length - 1} akun.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
