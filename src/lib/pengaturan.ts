import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings, type Settings } from '@/db/schema';

const KOSONG: Settings = {
  id: 1,
  namaPria: '',
  namaWanita: '',
  tanggalAkad: null,
  tanggalResepsi: null,
  venueAkad: '',
  venueResepsi: '',
  targetTamu: 0,
  totalBudget: 0,
  updatedAt: 0,
};

/**
 * Settings adalah baris tunggal id=1. Kalau seed belum jalan, kembalikan nilai
 * kosong supaya halaman tetap bisa dirender dan mengarahkan ke Pengaturan —
 * bukan melempar error.
 */
export async function ambilSettings(): Promise<Settings> {
  const [baris] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return baris ?? KOSONG;
}

export function namaPasangan(s: Settings): string {
  const a = s.namaPria.trim();
  const b = s.namaWanita.trim();
  if (a && b) return `${a} & ${b}`;
  return a || b || 'Rencana Kita';
}
