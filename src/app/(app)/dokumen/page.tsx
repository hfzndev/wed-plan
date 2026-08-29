import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { hariIni, selisihHari, tanggalPendek } from '@/lib/timeline';
import { LABEL_PIHAK } from '@/lib/label';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { BarProgres } from '@/components/bar-progres';
import { TautanTombol } from '@/components/ui/button';
import { BarisDokumen } from './baris-dokumen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URUTAN_PIHAK = ['pria', 'wanita', 'berdua'] as const;

export default async function HalamanDokumen() {
  const semua = await db.select().from(documents).orderBy(asc(documents.sortOrder), asc(documents.id));
  const acuan = hariIni();
  const selesai = semua.filter((d) => d.status === 'selesai').length;

  return (
    <>
      <KepalaHalaman
        eyebrow="Dokumen"
        judul="Berkas nikah"
        ket="Penomoran formulir N bisa berbeda antar daerah — konfirmasi ulang ke KUA kecamatan kalian."
        aksi={
          <TautanTombol href="/dokumen/baru" size="ikon" aria-label="Tambah dokumen">
            <Plus />
          </TautanTombol>
        }
      />

      <section className="mx-5 md:max-w-2xl">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-tinta-lembut">
            {selesai} dari {semua.length} selesai
          </span>
        </div>
        <BarProgres className="mt-2" nilai={selesai} maks={semua.length} warna="sage" />
      </section>

      <div className="mt-6 mb-6 space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:space-y-0 lg:gap-y-6">
        {URUTAN_PIHAK.map((pihak) => {
          const daftar = semua.filter((d) => d.pihak === pihak);
          if (daftar.length === 0) return null;
          return (
            <section key={pihak}>
              <h2 className="label-kecil px-5">{LABEL_PIHAK[pihak]}</h2>
              <ul className="mt-1.5 border-t border-garis">
                {daftar.map((d) => {
                  const sisa = d.deadline ? selisihHari(acuan, d.deadline) : null;
                  return (
                    <BarisDokumen
                      key={d.id}
                      id={d.id}
                      nama={d.nama}
                      status={d.status}
                      instansi={d.instansi}
                      catatan={d.catatan}
                      telat={sisa !== null && sisa < 0}
                      keterangan={
                        d.deadline
                          ? sisa !== null && sisa < 0
                            ? `Lewat ${Math.abs(sisa)} hari`
                            : `Target ${tanggalPendek(d.deadline)}`
                          : null
                      }
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
