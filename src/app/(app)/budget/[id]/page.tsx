import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { budgetItems, payments } from '@/db/schema';
import { ambilSettings } from '@/lib/pengaturan';
import { estimasiItem } from '@/lib/budget';
import { rupiah, rupiahRingkas } from '@/lib/money';
import { tanggalPendek, hariIni, selisihHari } from '@/lib/timeline';
import { LABEL_JENIS_BAYAR } from '@/lib/label';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormItemBudget } from '../form-item';
import { FormPembayaran } from './form-pembayaran';
import { TombolLunas } from '../tombol-lunas';
import { TombolHapusItem, TombolHapusPembayaran } from './tombol-hapus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanItemBudget({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) notFound();

  const [settings, [item], daftarBayar] = await Promise.all([
    ambilSettings(),
    db.select().from(budgetItems).where(eq(budgetItems.id, itemId)).limit(1),
    db.select().from(payments).where(eq(payments.budgetItemId, itemId)).orderBy(asc(payments.jatuhTempo)),
  ]);

  if (!item) notFound();

  const estimasi = estimasiItem(item, settings.targetTamu);
  const totalBayar = daftarBayar.reduce((n, p) => n + p.jumlah, 0);
  const sudahLunas = daftarBayar.filter((p) => p.status === 'lunas').reduce((n, p) => n + p.jumlah, 0);
  const nilaiItem = item.aktual ?? estimasi;
  const acuan = hariIni();

  return (
    <>
      <TautanKembali href="/budget" label="Budget" />
      <KepalaHalaman judul={item.nama} ket={item.catatan || undefined} />

      <section className="kartu mx-5 px-5 py-4">
        <h2 className="label-kecil">Jadwal pembayaran</h2>

        {daftarBayar.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-lembut">
            Belum ada. Tambahkan DP, termin, dan pelunasan sesuai kontrak vendor.
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-garis">
              {daftarBayar.map((p) => {
                const sisa = selisihHari(acuan, p.jatuhTempo);
                const telat = p.status === 'belum' && sisa !== null && sisa < 0;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm">
                        {LABEL_JENIS_BAYAR[p.jenis]}
                        {p.metode && <span className="text-tinta-samar"> · {p.metode}</span>}
                      </p>
                      <p className="text-xs text-tinta-samar">
                        {tanggalPendek(p.jatuhTempo)}
                        {telat && <span className="text-bahaya"> · telat {Math.abs(sisa)} hari</span>}
                        {p.catatan && ` · ${p.catatan}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="angka text-sm">{rupiahRingkas(p.jumlah)}</span>
                      <TombolLunas id={p.id} lunas={p.status === 'lunas'} />
                      <TombolHapusPembayaran id={p.id} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-3 space-y-1 border-t border-garis pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-tinta-lembut">Sudah dibayar</dt>
                <dd className="angka">{rupiah(sudahLunas)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta-lembut">Terjadwal</dt>
                <dd className="angka">{rupiah(totalBayar)}</dd>
              </div>
              {totalBayar !== nilaiItem && (
                <div className="flex justify-between">
                  <dt className="text-tinta-lembut">
                    {totalBayar < nilaiItem ? 'Belum terjadwal' : 'Lebih dari nilai item'}
                  </dt>
                  <dd className={`angka ${totalBayar > nilaiItem ? 'text-bahaya' : ''}`}>
                    {rupiah(Math.abs(nilaiItem - totalBayar))}
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>

      <div className="mt-4">
        <FormPembayaran budgetItemId={item.id} sisaBelumTerjadwal={Math.max(0, nilaiItem - totalBayar)} />
      </div>

      <h2 className="mx-5 mt-7 mb-3 text-lg">Ubah item</h2>
      <FormItemBudget awal={item} targetTamu={settings.targetTamu} />

      <div className="mx-5 mt-4 mb-8">
        <TombolHapusItem id={item.id} nama={item.nama} />
      </div>
    </>
  );
}
