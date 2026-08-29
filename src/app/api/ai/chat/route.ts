import { asc, desc } from 'drizzle-orm';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { sessionSaatIni } from '@/lib/auth';
import { alirkanJawaban, aiSiap, KesalahanAi, MAKS_RIWAYAT } from '@/lib/ai';
import { ambilSnapshot } from '@/lib/snapshot-server';
import { systemPrompt } from '@/lib/konteks-wedding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAKS_PANJANG_PESAN = 2_000;

/**
 * Route handler, bukan server action — server action tidak bisa streaming, dan
 * analisa menyeluruh butuh belasan detik. Layar diam selama itu tidak bisa
 * dibedakan dari aplikasi yang menggantung.
 */
export async function POST(req: Request) {
  const session = await sessionSaatIni();
  if (!session?.user) return new Response('Tidak diizinkan', { status: 401 });

  if (!aiSiap()) return new Response('AI belum dikonfigurasi.', { status: 503 });

  let pesan: string;
  try {
    const body = (await req.json()) as { pesan?: unknown };
    pesan = typeof body.pesan === 'string' ? body.pesan.trim() : '';
  } catch {
    return new Response('Body tidak valid', { status: 400 });
  }

  if (!pesan) return new Response('Pesan kosong', { status: 400 });
  if (pesan.length > MAKS_PANJANG_PESAN) {
    return new Response('Pesan terlalu panjang', { status: 400 });
  }

  await db.insert(chatMessages).values({
    peran: 'user',
    oleh: session.user.peran,
    isi: pesan,
  });

  // Diambil menurun lalu dibalik: LIMIT harus mengambil N pesan TERAKHIR,
  // bukan N pertama.
  const riwayatTerbaru = await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.id))
    .limit(MAKS_RIWAYAT);

  const riwayat = riwayatTerbaru
    .reverse()
    .map((m) => ({ peran: m.peran === 'asisten' ? ('assistant' as const) : ('user' as const), isi: m.isi }));

  const snapshot = await ambilSnapshot();
  const prompt = systemPrompt(snapshot);

  const encoder = new TextEncoder();
  let terkumpul = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const potongan of alirkanJawaban(prompt, riwayat)) {
          terkumpul += potongan;
          controller.enqueue(encoder.encode(potongan));
        }
      } catch (err) {
        const pesanError =
          err instanceof KesalahanAi ? err.message : 'Terjadi kesalahan tak terduga.';
        // Ditulis ke aliran, bukan dibuang: yang sudah tampil di layar tetap
        // berguna, dan pengguna berhak tahu kenapa jawabannya berhenti.
        const catatan = terkumpul ? `\n\n_(terputus: ${pesanError})_` : pesanError;
        terkumpul += catatan;
        controller.enqueue(encoder.encode(catatan));
      } finally {
        if (terkumpul.trim()) {
          await db.insert(chatMessages).values({ peran: 'asisten', oleh: null, isi: terkumpul });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      // Mencegah nginx menahan aliran di buffer sampai selesai.
      'X-Accel-Buffering': 'no',
    },
  });
}

/** Dipakai tombol "Hapus riwayat". */
export async function DELETE() {
  const session = await sessionSaatIni();
  if (!session?.user) return new Response('Tidak diizinkan', { status: 401 });

  await db.delete(chatMessages);
  return Response.json({ ok: true });
}

export { asc };
