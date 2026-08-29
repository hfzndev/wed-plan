import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/db';
import { budgetItems, payments } from '@/db/schema';
import { ambilSettings } from '@/lib/pengaturan';
import { ringkasBudget, ringkasPembayaran, estimasiItem, komitmenItem } from '@/lib/budget';
import { rupiah, rupiahRingkas, angka } from '@/lib/money';
import { tanggalPendek, hariIni, selisihHari } from '@/lib/timeline';
import { LABEL_KATEGORI, LABEL_JENIS_BAYAR, type KategoriBudget } from '@/lib/label';
import { KepalaHalaman, KosongState } from '@/components/kepala-halaman';
import { BarProgres } from '@/components/bar-progres';
import { TautanTombol } from '@/components/ui/button';
import { TombolLunas } from './tombol-lunas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanBudget({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const diPembayaran = tab === 'pembayaran';

  const [settings, items, semuaPembayaran] = await Promise.all([
    ambilSettings(),
    db.select().from(budgetItems).orderBy(asc(budgetItems.kategori), asc(budgetItems.nama)),
    db.select().from(payments).orderBy(asc(payments.jatuhTempo)),
  ]);

  const ringkasan = ringkasBudget(items, settings.targetTamu, settings.totalBudget);
  const bayar = ringkasPembayaran(semuaPembayaran, hariIni());
  const namaItem = new Map(items.map((i) => [i.id, i.nama]));

  return (
    <>
      <KepalaHalaman
        eyebrow="Budget"
        judul="Uang"
        aksi={
          <TautanTombol href="/budget/baru" size="ikon" aria-label="Tambah item budget">
            <Plus />
          </TautanTombol>
        }
      />

      <section className="kartu mx-5 px-5 py-4 md:max-w-3xl">
        <p className="angka text-2xl">
          {rupiah(ringkasan.totalKomitmen)}
          <span className="text-base text-tinta-samar">
            {' '}
            / {settings.totalBudget > 0 ? rupiahRingkas(settings.totalBudget) : '—'}
          </span>
        </p>
        <BarProgres className="mt-3" nilai={ringkasan.totalKomitmen} maks={settings.totalBudget} />

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-garis pt-3 text-center">
          <div>
            <dt className="label-kecil">Estimasi</dt>
            <dd className="angka mt-0.5 text-sm">{rupiahRingkas(ringkasan.totalEstimasi)}</dd>
          </div>
          <div>
            <dt className="label-kecil">Sudah bayar</dt>
            <dd className="angka mt-0.5 text-sm">{rupiahRingkas(bayar.totalLunas)}</dd>
          </div>
          <div>
            <dt className="label-kecil">{ringkasan.sisa < 0 ? 'Kelebihan' : 'Sisa dana'}</dt>
            <dd className={`angka mt-0.5 text-sm ${ringkasan.sisa < 0 ? 'text-bahaya' : ''}`}>
              {rupiahRingkas(Math.abs(ringkasan.sisa))}
            </dd>
          </div>
        </dl>

        {ringkasan.persenKatering > 0 && (
          <p className="mt-3 border-t border-garis pt-3 text-xs text-tinta-samar">
            Katering {ringkasan.persenKatering}% dari total komitmen.{' '}
            {ringkasan.persenKatering > 60
              ? 'Di atas rentang wajar 40–60%.'
              : ringkasan.persenKatering < 40
                ? 'Di bawah rentang wajar 40–60% — cek apakah semua pos katering sudah masuk.'
                : 'Masih di rentang wajar 40–60%.'}
          </p>
        )}
      </section>

      <nav className="mx-5 mt-5 flex gap-1 border-b border-garis md:max-w-3xl">
        <TabLink href="/budget" aktif={!diPembayaran}>
          Item
        </TabLink>
        <TabLink href="/budget?tab=pembayaran" aktif={diPembayaran}>
          Pembayaran
          {bayar.lewatTempo > 0 && <span className="ml-1.5 text-bahaya">•</span>}
        </TabLink>
      </nav>

      {diPembayaran ? (
        <TabPembayaran
          daftar={semuaPembayaran}
          namaItem={namaItem}
          lewatTempo={bayar.lewatTempo}
          belum={bayar.totalBelum}
        />
      ) : (
        <TabItem items={items} ringkasan={ringkasan} targetTamu={settings.targetTamu} />
      )}
    </>
  );
}

function TabLink({
  href,
  aktif,
  children,
}: {
  href: string;
  aktif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${
        aktif ? 'border-terracotta text-tinta' : 'border-transparent text-tinta-samar'
      }`}
    >
      {children}
    </Link>
  );
}

function TabItem({
  items,
  ringkasan,
  targetTamu,
}: {
  items: (typeof budgetItems.$inferSelect)[];
  ringkasan: ReturnType<typeof ringkasBudget>;
  targetTamu: number;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-5">
        <KosongState
          judul="Belum ada item budget"
          ket="Mulai dari pos terbesar: venue dan katering. Katering pilih tipe per orang supaya ikut berubah kalau target tamu berubah."
          aksi={<TautanTombol href="/budget/baru">Tambah item</TautanTombol>}
        />
      </div>
    );
  }

  return (
    <div className="mt-5 mb-6 space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:space-y-0 lg:gap-y-5">
      {ringkasan.perKategori.map((k) => (
        <section key={k.kategori}>
          <div className="mx-5 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">{LABEL_KATEGORI[k.kategori as KategoriBudget]}</h2>
            <span className="angka text-sm text-tinta-lembut">{rupiahRingkas(k.komitmen)}</span>
          </div>
          <ul className="mt-2">
            {items
              .filter((i) => i.kategori === k.kategori)
              .map((i) => {
                const estimasi = estimasiItem(i, targetTamu);
                const komitmen = komitmenItem(i, targetTamu);
                return (
                  <li key={i.id}>
                    <Link
                      href={`/budget/${i.id}`}
                      className="flex items-baseline justify-between gap-3 border-b border-garis px-5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{i.nama}</span>
                        <span className="block text-xs text-tinta-samar">
                          {i.tipe === 'per_pax'
                            ? `${rupiahRingkas(i.hargaSatuan)} × ${angka(targetTamu)} pax`
                            : i.qty > 1
                              ? `${rupiahRingkas(i.hargaSatuan)} × ${i.qty}`
                              : i.vendorNama || 'Lumpsum'}
                          {i.tipe === 'per_pax' && i.vendorNama && ` · ${i.vendorNama}`}
                        </span>
                      </span>
                      <span className="angka shrink-0 text-right text-sm">
                        {rupiahRingkas(komitmen)}
                        {i.aktual !== null && i.aktual !== estimasi && (
                          <span
                            className={`block text-xs ${i.aktual > estimasi ? 'text-bahaya' : 'text-sage'}`}
                          >
                            {i.aktual > estimasi ? '+' : '−'}
                            {rupiahRingkas(Math.abs(i.aktual - estimasi))}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TabPembayaran({
  daftar,
  namaItem,
  lewatTempo,
  belum,
}: {
  daftar: (typeof payments.$inferSelect)[];
  namaItem: Map<number, string>;
  lewatTempo: number;
  belum: number;
}) {
  if (daftar.length === 0) {
    return (
      <div className="mt-5">
        <KosongState
          judul="Belum ada jadwal pembayaran"
          ket="Buka salah satu item budget, lalu tambahkan DP, termin, dan pelunasannya sesuai kontrak vendor."
        />
      </div>
    );
  }

  const acuan = hariIni();

  return (
    <div className="mt-5 mb-6">
      <div className="mx-5 flex justify-between text-xs text-tinta-lembut">
        <span>Belum dibayar {rupiahRingkas(belum)}</span>
        {lewatTempo > 0 && <span className="text-bahaya">Lewat tempo {rupiahRingkas(lewatTempo)}</span>}
      </div>

      <ul className="mt-2">
        {daftar.map((p) => {
          const sisa = selisihHari(acuan, p.jatuhTempo);
          const telat = p.status === 'belum' && sisa !== null && sisa < 0;
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-garis px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {namaItem.get(p.budgetItemId) ?? 'Item terhapus'}
                </p>
                <p className="text-xs text-tinta-samar">
                  {LABEL_JENIS_BAYAR[p.jenis]} · {tanggalPendek(p.jatuhTempo)}
                  {telat && <span className="text-bahaya"> · telat {Math.abs(sisa)} hari</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="angka text-sm">{rupiahRingkas(p.jumlah)}</span>
                <TombolLunas id={p.id} lunas={p.status === 'lunas'} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
