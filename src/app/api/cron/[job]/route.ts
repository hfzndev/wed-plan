import { jalankanJob, type Job } from '@/lib/reminder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOB_VALID: Job[] = ['harian', 'mingguan'];

/**
 * Pemicu reminder, dipanggil cron sistem di VPS.
 *
 * Dilindungi `CRON_SECRET`, bukan sesi login — cron tidak punya cookie.
 * Kalau `CRON_SECRET` kosong, endpoint ini menolak semua panggilan: rahasia yang
 * tidak diisi harus berarti tertutup, bukan terbuka untuk siapa saja.
 *
 * GET, bukan POST, supaya baris crontab-nya cukup satu `curl` tanpa flag.
 * Aman karena hasilnya idempoten — `notification_log` yang menjamin panggilan
 * kedua di hari yang sama tidak mengirim ulang.
 */
export async function GET(req: Request, { params }: { params: Promise<{ job: string }> }) {
  const rahasia = process.env.CRON_SECRET?.trim();
  if (!rahasia) {
    return Response.json({ error: 'CRON_SECRET belum diisi' }, { status: 503 });
  }

  const header = req.headers.get('authorization') ?? '';
  if (header !== `Bearer ${rahasia}`) {
    return Response.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  const { job } = await params;
  if (!JOB_VALID.includes(job as Job)) {
    return Response.json({ error: `Job "${job}" tidak dikenal` }, { status: 404 });
  }

  const hasil = await jalankanJob(job as Job);

  // 200 selama job-nya benar-benar berjalan. Kegagalan per-nomor ada di body dan
  // di notification_log — bukan alasan membuat cron menandai seluruh run gagal.
  return Response.json(hasil);
}
