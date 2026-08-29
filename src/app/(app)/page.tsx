import Link from 'next/link';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { ringkasanBeranda } from '@/lib/beranda';
import { namaPasangan } from '@/lib/pengaturan';
import { rupiah, rupiahRingkas } from '@/lib/money';
import { tanggalPanjang, tanggalPendek, LABEL_FASE, type Fase } from '@/lib/timeline';
import { BarProgres } from '@/components/bar-progres';
import { TautanTombol } from '@/components/ui/button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function Beranda() {
  const d = await ringkasanBeranda();
  const { settings, budget } = d;
  const adaPembayaran = d.pembayaran.lewatTempo > 0 || d.pembayaranMendatang.length > 0;

  return (
    <>
      {/* Nama pasangan sudah ada di sidebar desktop, jadi header ini hanya untuk ponsel. */}
      <header className="px-5 pt-8 pb-5 md:hidden">
        <p className="label-kecil">Rencana Kita</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight">{namaPasangan(settings)}</h1>
      </header>

      <div className="px-5 pb-6 md:pt-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="lg:col-span-2">
            {settings.tanggalResepsi ? (
              <div className="kartu px-5 py-6 text-center md:flex md:items-center md:justify-center md:gap-10 md:py-8 md:text-left">
                <div>
                  <p className="label-kecil">Resepsi</p>
                  <p className="mt-1 text-sm text-tinta-lembut">
                    {tanggalPanjang(settings.tanggalResepsi)}
                  </p>
                  {settings.venueResepsi && (
                    <p className="text-sm text-tinta-samar">{settings.venueResepsi}</p>
                  )}
                </div>

                <div className="mt-3 md:mt-0 md:border-l md:border-garis md:pl-10">
                  <p className="angka font-serif text-5xl leading-none md:text-6xl">
                    {d.mundurResepsi !== null && d.mundurResepsi >= 0 ? d.mundurResepsi : 0}
                  </p>
                  <p className="mt-1 text-sm text-tinta-lembut">
                    {d.mundurResepsi === null
                      ? ''
                      : d.mundurResepsi > 0
                        ? 'hari lagi'
                        : d.mundurResepsi === 0
                          ? 'Hari ini!'
                          : `hari lalu — sudah lewat ${Math.abs(d.mundurResepsi)} hari`}
                  </p>
                </div>

                {settings.tanggalAkad && (
                  <p className="mt-4 border-t border-garis pt-3 text-sm text-tinta-lembut md:mt-0 md:border-t-0 md:border-l md:pt-0 md:pl-10">
                    Akad {tanggalPendek(settings.tanggalAkad)}
                    {d.mundurAkad !== null && d.mundurAkad >= 0 && (
                      <span className="block md:mt-1">{d.mundurAkad} hari lagi</span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="kartu px-5 py-6">
                <CalendarPlus className="size-6 text-terracotta" />
                <p className="mt-3 font-medium">Tanggal belum ditentukan</p>
                <p className="mt-1 max-w-prose text-sm text-tinta-lembut">
                  Isi tanggal resepsi dan semua task di Checklist langsung mendapat jatuh temponya
                  sendiri, dihitung mundur dari hari H.
                </p>
                <TautanTombol href="/pengaturan" className="mt-4">
                  Tentukan tanggal
                </TautanTombol>
              </div>
            )}
          </section>

          <KartuLink href="/budget" label="Budget" className={adaPembayaran ? undefined : 'lg:col-span-2'}>
            <p className="angka mt-2 text-2xl">
              {rupiah(budget.totalKomitmen)}
              <span className="text-base text-tinta-samar">
                {' '}
                / {settings.totalBudget > 0 ? rupiahRingkas(settings.totalBudget) : '—'}
              </span>
            </p>
            <BarProgres className="mt-3" nilai={budget.totalKomitmen} maks={settings.totalBudget} />
            <div className="mt-3 flex justify-between text-xs text-tinta-lembut">
              <span>
                {settings.totalBudget > 0
                  ? `${budget.persenTerpakai}% terpakai`
                  : 'Total budget belum diisi'}
              </span>
              <span className={budget.sisa < 0 ? 'text-bahaya' : undefined}>
                {budget.sisa < 0 ? 'Lebih ' : 'Sisa '}
                {rupiahRingkas(Math.abs(budget.sisa))}
              </span>
            </div>
            {budget.persenKatering > 0 && (
              <p className="mt-3 border-t border-garis pt-3 text-xs text-tinta-samar">
                Katering {budget.persenKatering}% dari total.
                {budget.persenKatering > 60 && ' Di atas rentang wajar 40–60%.'}
              </p>
            )}
          </KartuLink>

          {adaPembayaran && (
            <KartuLink href="/budget?tab=pembayaran" label="Pembayaran">
              {d.pembayaran.lewatTempo > 0 && (
                <p className="angka mt-2 text-sm text-bahaya">
                  {rupiah(d.pembayaran.lewatTempo)} lewat tempo
                </p>
              )}
              <ul className="mt-2 space-y-2">
                {d.pembayaranMendatang.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-tinta-lembut">
                      {p.jenis === 'dp' ? 'DP' : p.jenis === 'termin' ? 'Termin' : 'Pelunasan'}
                      {p.catatan && ` · ${p.catatan}`}
                    </span>
                    <span className="angka shrink-0">
                      {rupiahRingkas(p.jumlah)}
                      <span
                        className={
                          p.sisaHari !== null && p.sisaHari < 0 ? 'text-bahaya' : 'text-tinta-samar'
                        }
                      >
                        {' '}
                        · {tanggalPendek(p.jatuhTempo)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </KartuLink>
          )}

          <KartuLink href="/checklist" label="Berikutnya">
            {d.taskTerdekat.length === 0 ? (
              <p className="mt-2 text-sm text-tinta-lembut">Semua task sudah selesai.</p>
            ) : (
              <ul className="mt-2 space-y-2.5">
                {d.taskTerdekat.map((t) => (
                  <li key={t.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{t.judul}</span>
                    <span className="shrink-0 text-xs text-tinta-samar">
                      {t.sisaHari === null ? (
                        LABEL_FASE[t.fase as Fase]
                      ) : t.sisaHari < 0 ? (
                        <span className="text-bahaya">{Math.abs(t.sisaHari)} hari lewat</span>
                      ) : (
                        `${t.sisaHari} hari`
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 border-t border-garis pt-3 text-xs text-tinta-samar">
              {d.sisaTask} task belum selesai
            </p>
          </KartuLink>

          <KartuLink href="/dokumen" label="Dokumen KUA">
            <p className="angka mt-2 text-2xl">
              {d.dokumen.selesai}
              <span className="text-base text-tinta-samar"> / {d.dokumen.total} selesai</span>
            </p>
            <BarProgres
              className="mt-3"
              nilai={d.dokumen.selesai}
              maks={d.dokumen.total}
              warna="sage"
            />
          </KartuLink>
        </div>
      </div>
    </>
  );
}

/** Kartu ringkasan yang seluruh permukaannya bisa diklik. */
function KartuLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`kartu block px-5 py-4 md:transition-colors md:hover:border-garis-kuat ${className ?? ''}`}>
      <div className="flex items-baseline justify-between">
        <p className="label-kecil">{label}</p>
        <ArrowRight className="size-4 text-tinta-samar" />
      </div>
      {children}
    </Link>
  );
}
