import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { db } from '@/db';
import { ideas, decisions } from '@/db/schema';
import { tanggalPendek } from '@/lib/timeline';
import { LABEL_PIHAK } from '@/lib/label';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { cn } from '@/lib/cn';
import { TambahIde, TambahKeputusan, TombolFavorit, TombolHapus } from './form-ide';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanIde({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const diKeputusan = tab === 'keputusan';

  const [daftarIde, daftarKeputusan] = await Promise.all([
    db.select().from(ideas).orderBy(desc(ideas.favorit), desc(ideas.createdAt)),
    db.select().from(decisions).orderBy(desc(decisions.tanggal), desc(decisions.id)),
  ]);

  return (
    <>
      <KepalaHalaman eyebrow="Ide & Keputusan" judul="Referensi" />

      <nav className="mx-5 flex gap-1 border-b border-garis">
        <Tab href="/ide" aktif={!diKeputusan} jumlah={daftarIde.length}>
          Ide
        </Tab>
        <Tab href="/ide?tab=keputusan" aktif={diKeputusan} jumlah={daftarKeputusan.length}>
          Keputusan
        </Tab>
      </nav>

      {diKeputusan ? (
        <>
          {daftarKeputusan.length === 0 ? (
            <p className="px-5 pt-4 text-sm text-tinta-lembut">
              Belum ada. Catat setiap kesepakatan berdua beserta alasannya — supaya tidak
              diperdebatkan ulang tiga bulan lagi.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 px-5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {daftarKeputusan.map((k) => (
                <li key={k.id} className="kartu h-full px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="label-kecil">{k.topik}</p>
                    <TombolHapus id={k.id} label={k.topik} jenis="keputusan" />
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{k.keputusan}</p>
                  {k.alasan && (
                    <p className="mt-2 border-l-2 border-garis pl-3 text-xs leading-relaxed text-tinta-lembut">
                      {k.alasan}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-tinta-samar">
                    {tanggalPendek(k.tanggal)} · {LABEL_PIHAK[k.oleh]}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <TambahKeputusan />
        </>
      ) : (
        <>
          {daftarIde.length === 0 ? (
            <p className="px-5 pt-4 text-sm text-tinta-lembut">
              Belum ada ide tersimpan. Tempel link Instagram atau Pinterest yang kalian suka supaya
              tidak hilang di gulungan chat.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 px-5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
              {daftarIde.map((i) => (
                <li key={i.id} className="kartu h-full px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i.judul}</p>
                      {i.kategori && <p className="text-xs text-tinta-samar">{i.kategori}</p>}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <TombolFavorit id={i.id} favorit={i.favorit} />
                      <TombolHapus id={i.id} label={i.judul} jenis="ide" />
                    </div>
                  </div>

                  {i.catatan && (
                    <p className="mt-1.5 text-sm leading-relaxed text-tinta-lembut">{i.catatan}</p>
                  )}

                  {i.url && (
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-terracotta"
                    >
                      <ExternalLink className="size-3.5" />
                      Buka tautan
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <TambahIde />
        </>
      )}
      <div className="h-8" />
    </>
  );
}

function Tab({
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
