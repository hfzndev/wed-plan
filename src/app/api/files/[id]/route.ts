import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vendorFiles } from '@/db/schema';
import { sessionSaatIni } from '@/lib/auth';
import { pathAman } from '@/lib/berkas';

export const runtime = 'nodejs';

/**
 * Berkas disajikan lewat route ini, bukan dari folder public, supaya tidak ada
 * cara mengaksesnya tanpa sesi yang sah.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await sessionSaatIni();
  if (!session?.user) return new Response('Tidak diizinkan', { status: 401 });

  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId) || fileId <= 0) return new Response('Tidak ditemukan', { status: 404 });

  const [baris] = await db.select().from(vendorFiles).where(eq(vendorFiles.id, fileId)).limit(1);
  if (!baris) return new Response('Tidak ditemukan', { status: 404 });

  const penuh = pathAman(baris.path);
  if (!penuh) return new Response('Tidak ditemukan', { status: 404 });

  try {
    await stat(penuh);
  } catch {
    return new Response('Berkas hilang dari disk', { status: 410 });
  }

  const stream = Readable.toWeb(createReadStream(penuh)) as ReadableStream;

  return new Response(stream, {
    headers: {
      'Content-Type': baris.mime,
      'Content-Length': String(baris.size),
      // `inline` supaya PDF dan gambar bisa dibuka langsung di HP.
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(baris.namaAsli)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
