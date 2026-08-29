import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const path = process.env.DATABASE_PATH ?? './data/wedplan.db';

async function main() {
  mkdirSync(dirname(path), { recursive: true });
  const client = createClient({ url: `file:${path}` });
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  client.close();
  console.log(`Migrasi selesai — ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
