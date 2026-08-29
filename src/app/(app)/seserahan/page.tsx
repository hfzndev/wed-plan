import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { seserahanItems, KATEGORI_SESERAHAN, type SeserahanItem } from '@/db/schema';
import { rupiah, rupiahRingkas } from '@/lib/money';
import { LABEL_KATEGORI_SESERAHAN, type KategoriSeserahan } from '@/lib/label';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { cn } from '@/lib/cn';
import { TambahSeserahan, TombolDibeli, TombolHapusSeserahan } from './form-seserahan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanSeserahan() {
  const semua = await db
    .select()
    .from(seserahanItems)
    .orderBy(asc(seserahanItems.sortOrder), asc(seserahanItems.id));

  const mahar = semua.filter((s) => s.isMahar);
  const seserahan = semua.filter((s) => !s.isMahar);

  const nilai = (s: SeserahanItem) => s.aktual ?? s.estimasi;
  const total = semua.reduce((n, s) => n + nilai(s), 0);
  const totalEstimasi = semua.reduce((n, s) => n + s.estimasi, 0);
  const sudah = semua.filter((s) => s.status === 'dibeli').length;

  return (
    <>
      <KepalaHalaman
        eyebrow="Seserahan"
        judul="Barang & mahar"
        ket="Biaya di sini tidak otomatis masuk Budget — catat sendiri sebagai item budget kalau ingin ikut hitungan total."
      />

      {semua.length > 0 && (
        <section className="kartu mx-5 px-5 py-4 md:max-w-2xl">
          <p className="angka text-2xl">{rupiah(total)}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-garis pt-3">
            <div>
              <dt className="label-kecil">Estimasi awal</dt>
              <dd className="angka mt-0.5 text-sm">{rupiahRingkas(totalEstimasi)}</dd>
            </div>
            <div>
              <dt className="label-kecil">Sudah dibeli</dt>
              <dd className="angka mt-0.5 text-sm">
                {sudah} / {semua.length}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {mahar.length > 0 && (
        <Bagian judul="Mahar" items={mahar} />
      )}

      {KATEGORI_SESERAHAN.map((k) => {
        const daftar = seserahan.filter((s) => s.kategori === k);
        if (daftar.length === 0) return null;
        return <Bagian key={k} judul={LABEL_KATEGORI_SESERAHAN[k as KategoriSeserahan]} items={daftar} />;
      })}

      {semua.length === 0 && (
        <p className="mt-4 px-5 text-sm text-tinta-lembut">
          Belum ada barang. Mulai dari mahar, lalu perlengkapan ibadah, pakaian, dan kosmetik.
        </p>
      )}

      <TambahSeserahan />
      <div className="h-8" />
    </>
  );
}

function Bagian({ judul, items }: { judul: string; items: SeserahanItem[] }) {
  const subtotal = items.reduce((n, s) => n + (s.aktual ?? s.estimasi), 0);

  return (
    <section className="mt-6">
      <div className="mx-5 flex items-baseline justify-between">
        <h2 className="label-kecil">{judul}</h2>
        <span className="angka text-xs text-tinta-samar">{rupiahRingkas(subtotal)}</span>
      </div>
      <ul className="mt-1.5 border-t border-garis">
        {items.map((s) => {
          const dibeli = s.status === 'dibeli';
          const selisih = s.aktual !== null ? s.aktual - s.estimasi : 0;
          return (
            <li key={s.id} className="flex items-start gap-3 border-b border-garis px-5 py-3">
              <TombolDibeli id={s.id} dibeli={dibeli} nama={s.nama} />

              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', dibeli && 'text-tinta-samar')}>{s.nama}</p>
                {s.catatan && <p className="text-xs text-tinta-samar">{s.catatan}</p>}
              </div>

              <div className="shrink-0 text-right">
                <p className="angka text-sm">{rupiahRingkas(s.aktual ?? s.estimasi)}</p>
                {s.aktual !== null && selisih !== 0 && (
                  <p className={cn('angka text-xs', selisih > 0 ? 'text-bahaya' : 'text-sage')}>
                    {selisih > 0 ? '+' : '−'}
                    {rupiahRingkas(Math.abs(selisih))}
                  </p>
                )}
              </div>

              <TombolHapusSeserahan id={s.id} nama={s.nama} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
