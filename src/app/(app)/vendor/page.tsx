import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';
import { Plus, Star } from 'lucide-react';
import { db } from '@/db';
import { vendors, STATUS_VENDOR } from '@/db/schema';
import { rupiahRingkas } from '@/lib/money';
import { LABEL_KATEGORI, LABEL_STATUS_VENDOR, type StatusVendor } from '@/lib/label';
import { KepalaHalaman, KosongState } from '@/components/kepala-halaman';
import { TautanTombol } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WARNA_STATUS: Record<StatusVendor, string> = {
  shortlist: 'bg-garis text-tinta-lembut',
  survei: 'bg-garis text-tinta-lembut',
  nego: 'bg-terracotta-lembut text-terracotta',
  booked: 'bg-sage-lembut text-sage',
  batal: 'bg-bahaya-lembut text-bahaya',
};

export default async function HalamanVendor({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = STATUS_VENDOR.includes(status as StatusVendor) ? (status as StatusVendor) : null;

  const semua = await db
    .select()
    .from(vendors)
    .orderBy(desc(vendors.updatedAt), asc(vendors.nama));

  const tampil = filter ? semua.filter((v) => v.status === filter) : semua;
  const hitung = (s: StatusVendor) => semua.filter((v) => v.status === s).length;

  return (
    <>
      <KepalaHalaman
        eyebrow="Vendor"
        judul="Kandidat & kontrak"
        aksi={
          <TautanTombol href="/vendor/baru" size="ikon" aria-label="Tambah vendor">
            <Plus />
          </TautanTombol>
        }
      />

      {semua.length > 0 && (
        <nav className="flex gap-2 overflow-x-auto px-5 pb-4">
          <ChipFilter href="/vendor" aktif={!filter}>
            Semua {semua.length}
          </ChipFilter>
          {STATUS_VENDOR.map((s) => (
            <ChipFilter key={s} href={`/vendor?status=${s}`} aktif={filter === s}>
              {LABEL_STATUS_VENDOR[s]} {hitung(s)}
            </ChipFilter>
          ))}
        </nav>
      )}

      {tampil.length === 0 ? (
        <KosongState
          judul={filter ? `Belum ada vendor berstatus ${LABEL_STATUS_VENDOR[filter]}` : 'Belum ada vendor'}
          ket={
            filter
              ? undefined
              : 'Catat setiap kandidat sejak tahap survei, lengkap dengan harga penawarannya. Membandingkan jadi mudah saat harus memutuskan.'
          }
          aksi={filter ? undefined : <TautanTombol href="/vendor/baru">Tambah vendor</TautanTombol>}
        />
      ) : (
        <ul className="mb-6 space-y-2 px-5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
          {tampil.map((v) => (
            <li key={v.id}>
              <Link href={`/vendor/${v.id}`} className="kartu block h-full px-4 py-3 md:transition-colors md:hover:border-garis-kuat">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.nama}</p>
                    <p className="text-xs text-tinta-samar">
                      {LABEL_KATEGORI[v.kategori]}
                      {v.lokasi && ` · ${v.lokasi}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px]',
                      WARNA_STATUS[v.status],
                    )}
                  >
                    {LABEL_STATUS_VENDOR[v.status]}
                  </span>
                </div>

                {(v.hargaPenawaran > 0 || v.rating) && (
                  <div className="mt-2 flex items-center gap-3">
                    {v.hargaPenawaran > 0 && (
                      <span className="angka text-sm">{rupiahRingkas(v.hargaPenawaran)}</span>
                    )}
                    {v.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-tinta-samar">
                        {Array.from({ length: v.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-terracotta text-terracotta" />
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ChipFilter({
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
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap',
        aktif ? 'border-terracotta bg-terracotta text-white' : 'border-garis-kuat text-tinta-lembut',
      )}
    >
      {children}
    </Link>
  );
}
