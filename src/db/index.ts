import 'server-only';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * File SQLite biasa di disk VPS. libsql dipakai sebagai binding-nya (punya
 * binary prebuilt, tidak perlu toolchain C++), tapi formatnya tetap SQLite
 * standar — `sqlite3 .backup` dan drizzle-kit tetap berlaku.
 */
export const dbPath = process.env.DATABASE_PATH ?? './data/wedplan.db';
export const dbUrl = dbPath.startsWith('file:') ? dbPath : `file:${dbPath}`;

// Hot reload di dev membuat modul ulang; simpan client di globalThis supaya
// koneksi ke file tidak menumpuk.
const globalForDb = globalThis as unknown as { libsql?: Client };

const client = globalForDb.libsql ?? createClient({ url: dbUrl });
if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
