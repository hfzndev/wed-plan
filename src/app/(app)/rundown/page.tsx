import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { rundownItems } from '@/db/schema';
import { ambilSettings } from '@/lib/pengaturan';
import { tanggalPanjang } from '@/lib/timeline';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { cn } from '@/lib/cn';
import { DaftarRundown } from './daftar-rundown';
import { TambahRundown } from './form-rundown';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanRundown({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string }>;
}) {
  const { acara } = await searchParams;
  const aktif: 'akad' | 'resepsi' = acara === 'resepsi' ? 'resepsi' : 'akad';

  const [settings, semua] = await Promise.all([
    ambilSettings(),
    db.select().from(rundownItems).orderBy(asc(rundownItems.waktuMulai), asc(rundownItems.id)),
  ]);

  const items = semua.filter((r) => r.acara === aktif);
  const tanggal = aktif === 'akad' ? settings.tanggalAkad : settings.tanggalResepsi;
  const venue = aktif === 'akad' ? settings.venueAkad : settings.venueResepsi;

  return (
    <>
      <KepalaHalaman
        eyebrow="Rundown"
        judul="Susunan acara"
        ket="Kalian mengatur sendiri tanpa WO, jadi rundown ini yang jadi pegangan keluarga dan vendor."
      />

      <nav className="mx-5 flex gap-1 border-b border-garis md:max-w-2xl">
        <TabAcara href="/rundown" aktif={aktif === 'akad'} jumlah={semua.filter((r) => r.acara === 'akad').length}>
          Akad
        </TabAcara>
        <TabAcara
          href="/rundown?acara=resepsi"
          aktif={aktif === 'resepsi'}
          jumlah={semua.filter((r) => r.acara === 'resepsi').length}
        >
          Resepsi
        </TabAcara>
      </nav>

      <p className="px-5 pt-4 text-sm text-tinta-lembut">
        {tanggal ? tanggalPanjang(tanggal) : 'Tanggal belum diisi'}
        {venue && ` · ${venue}`}
        {!tanggal && (
          <>
            {' '}
            <Link href="/pengaturan" className="text-terracotta underline">
              Isi di Pengaturan
            </Link>
          </>
        )}
      </p>

      {items.length === 0 ? (
        <p className="mt-4 px-5 text-sm text-tinta-lembut">
          Belum ada kegiatan. Mulai dari jam vendor masuk, lalu make up, akad, dan seterusnya.
        </p>
      ) : (
        <DaftarRundown items={items} />
      )}

      <TambahRundown acara={aktif} />
      <div className="h-8" />
    </>
  );
}

function TabAcara({
  href,
  aktif,
  jumlah,
  children,
}: {
  href: string;
  aktif: boolean;
  jumlah: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        '-mb-px border-b-2 px-3 py-2.5 text-sm',
        aktif ? 'border-terracotta text-tinta' : 'border-transparent text-tinta-samar',
      )}
    >
      {children}
      {jumlah > 0 && <span className="angka ml-1.5 text-xs text-tinta-samar">{jumlah}</span>}
    </Link>
  );
}
