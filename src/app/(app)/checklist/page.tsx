import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { ambilSettings } from '@/lib/pengaturan';
import {
  dueDateTask,
  lewatTempo,
  hariIni,
  selisihHari,
  tanggalPendek,
  LABEL_FASE,
  URUTAN_FASE,
  type Fase,
} from '@/lib/timeline';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { BarProgres } from '@/components/bar-progres';
import { TautanTombol } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { BarisTask } from './baris-task';
import { Papan, type KartuTask } from './papan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIAPA = [
  { nilai: '', label: 'Semua' },
  { nilai: 'berdua', label: 'Berdua' },
  { nilai: 'pria', label: 'Pria' },
  { nilai: 'wanita', label: 'Wanita' },
] as const;

export default async function HalamanChecklist({
  searchParams,
}: {
  searchParams: Promise<{ siapa?: string; selesai?: string }>;
}) {
  const { siapa, selesai } = await searchParams;
  const filterSiapa = ['pria', 'wanita', 'berdua'].includes(siapa ?? '') ? siapa : null;
  const tampilkanSelesai = selesai === '1';

  const [settings, semua] = await Promise.all([
    ambilSettings(),
    db.select().from(tasks).orderBy(asc(tasks.sortOrder), asc(tasks.id)),
  ]);

  const acuan = hariIni();
  const diperkaya = semua.map((t) => {
    const dueDate = dueDateTask(t, settings.tanggalResepsi);
    const done = t.status === 'done';
    return {
      ...t,
      dueDate,
      done,
      telat: lewatTempo(dueDate, done, acuan),
      sisaHari: dueDate ? selisihHari(acuan, dueDate) : null,
    };
  });

  const terfilter = diperkaya.filter(
    (t) => (!filterSiapa || t.assignee === filterSiapa) && (tampilkanSelesai || !t.done),
  );

  const totalTampak = diperkaya.filter((t) => !filterSiapa || t.assignee === filterSiapa);
  const selesaiCount = totalTampak.filter((t) => t.done).length;

  // Fase 'pra' didahulukan selama tanggal belum ada — itu justru task yang
  // menghasilkan tanggalnya.
  const fasePakai = URUTAN_FASE.filter((f) => terfilter.some((t) => t.fase === f));

  // Papan menerima set yang hanya disaring penanggung jawab; saringan "selesai"
  // diterapkan di dalam papan supaya header kolom tetap bisa menghitung progres
  // sebenarnya.
  const kartuPapan: KartuTask[] = totalTampak.map((t) => ({
    id: t.id,
    judul: t.judul,
    fase: t.fase,
    assignee: t.assignee,
    selesai: t.done,
    telat: t.telat,
    keterangan: keteranganTanggal(t.dueDate, t.sisaHari, t.done),
    terkunci: t.dueDateOverride !== null,
  }));

  return (
    <>
      <KepalaHalaman
        eyebrow="Checklist"
        judul="Persiapan"
        aksi={
          <TautanTombol href="/checklist/baru" size="ikon" aria-label="Tambah task">
            <Plus />
          </TautanTombol>
        }
      />

      <section className="mx-5 md:max-w-2xl">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-tinta-lembut">
            {selesaiCount} dari {totalTampak.length} selesai
          </span>
          <span className="angka text-tinta-lembut">
            {totalTampak.length > 0 ? Math.round((selesaiCount / totalTampak.length) * 100) : 0}%
          </span>
        </div>
        <BarProgres className="mt-2" nilai={selesaiCount} maks={totalTampak.length} warna="sage" />
        {!settings.tanggalResepsi && (
          <p className="mt-3 text-xs text-tinta-samar">
            Tanggal resepsi belum diisi, jadi task belum punya jatuh tempo.{' '}
            <Link href="/pengaturan" className="text-terracotta underline">
              Isi sekarang
            </Link>
            .
          </p>
        )}
      </section>

      <nav className="mt-4 flex gap-2 overflow-x-auto px-5 pb-4">
        {SIAPA.map((s) => {
          const href = bangunHref(s.nilai, tampilkanSelesai);
          const aktif = (filterSiapa ?? '') === s.nilai;
          return (
            <Chip key={s.nilai} href={href} aktif={aktif}>
              {s.label}
            </Chip>
          );
        })}
        <Chip href={bangunHref(filterSiapa ?? '', !tampilkanSelesai)} aktif={tampilkanSelesai}>
          Tampilkan selesai
        </Chip>
      </nav>

      {terfilter.length === 0 ? (
        <p className="px-5 text-sm text-tinta-lembut">
          Tidak ada task yang cocok dengan filter ini.
        </p>
      ) : (
        <>
          {/* Dua tampilan, satu sumber data. Kalau keterangan tanggal dihitung
              ulang di masing-masing, cepat atau lambat keduanya akan berbeda
              untuk task yang sama. */}
          <div className="mb-6 space-y-6 lg:hidden">
            {fasePakai.map((fase) => {
              const daftar = terfilter.filter((t) => t.fase === fase);
              return (
                <section key={fase}>
                  <h2 className="label-kecil px-5">{LABEL_FASE[fase as Fase]}</h2>
                  <ul className="mt-1.5 border-t border-garis">
                    {daftar.map((t) => (
                      <BarisTask
                        key={t.id}
                        id={t.id}
                        judul={t.judul}
                        deskripsi={t.deskripsi}
                        assignee={t.assignee}
                        selesai={t.done}
                        telat={t.telat}
                        keterangan={keteranganTanggal(t.dueDate, t.sisaHari, t.done)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mb-6 hidden lg:block">
            <Papan kartu={kartuPapan} tampilkanSelesai={tampilkanSelesai} />
          </div>
        </>
      )}
    </>
  );
}

function bangunHref(siapa: string, selesai: boolean) {
  const q = new URLSearchParams();
  if (siapa) q.set('siapa', siapa);
  if (selesai) q.set('selesai', '1');
  const s = q.toString();
  return s ? `/checklist?${s}` : '/checklist';
}

function keteranganTanggal(dueDate: string | null, sisaHari: number | null, done: boolean) {
  if (done) return 'Selesai';
  if (!dueDate || sisaHari === null) return 'Belum terjadwal';
  if (sisaHari < 0) return `Telat ${Math.abs(sisaHari)} hari · ${tanggalPendek(dueDate)}`;
  if (sisaHari === 0) return `Hari ini · ${tanggalPendek(dueDate)}`;
  return `${sisaHari} hari lagi · ${tanggalPendek(dueDate)}`;
}

function Chip({ href, aktif, children }: { href: string; aktif: boolean; children: React.ReactNode }) {
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
