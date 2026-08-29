'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Pencil, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LABEL_PIHAK } from '@/lib/label';
import { LABEL_FASE, URUTAN_FASE, type Fase } from '@/lib/timeline';
import { toggleTask, pindahFase } from './actions';

export interface KartuTask {
  id: number;
  judul: string;
  fase: Fase;
  assignee: 'pria' | 'wanita' | 'berdua';
  selesai: boolean;
  telat: boolean;
  keterangan: string;
  /** Tanggalnya dikunci manual, jadi tidak ikut bergeser saat pindah kolom. */
  terkunci: boolean;
}

/**
 * Papan kanban dengan kolom per fase waktu.
 *
 * Kolom sengaja fase, bukan status: seluruh 64 task masih `todo`, jadi papan
 * berkolom status akan jadi satu kolom raksasa dan dua kolom kosong. Kolom fase
 * langsung terisi merata dan menampilkan seluruh rentang persiapan sekaligus.
 *
 * Hanya dirender di `lg` ke atas — lihat `page.tsx`. Itu sebabnya drag HTML5
 * bawaan sudah cukup dan `@dnd-kit` tidak dipakai: tidak ada sentuhan yang perlu
 * didukung, dan urutan kartu di dalam kolom tidak diatur pengguna.
 */
export function Papan({
  kartu,
  tampilkanSelesai,
}: {
  /** Seluruh kartu yang lolos filter penanggung jawab — termasuk yang sudah selesai. */
  kartu: KartuTask[];
  tampilkanSelesai: boolean;
}) {
  const router = useRouter();
  const [, mulai] = useTransition();
  const [diseret, setDiseret] = useState<number | null>(null);
  const [kolomTujuan, setKolomTujuan] = useState<Fase | null>(null);

  // Kartu berpindah kolom seketika; hasil sebenarnya menyusul lewat refresh.
  const [optimis, pindahOptimis] = useOptimistic(
    kartu,
    (semula, { id, fase }: { id: number; fase: Fase }) =>
      semula.map((k) => (k.id === id ? { ...k, fase } : k)),
  );

  function pindah(id: number, fase: Fase) {
    const sekarang = optimis.find((k) => k.id === id);
    if (!sekarang || sekarang.fase === fase) return;

    mulai(async () => {
      pindahOptimis({ id, fase });
      await pindahFase(id, fase);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto px-5 pb-4">
      <div className="flex gap-3">
        {URUTAN_FASE.map((fase) => {
          // Header dihitung dari seluruh isi kolom, bukan hanya yang tampak.
          // Kalau tidak, mencentang satu task justru membuat header berbunyi
          // "0/9 selesai" — progres yang baru saja dicapai malah menghilang.
          const semuaDiKolom = optimis.filter((k) => k.fase === fase);
          const selesai = semuaDiKolom.filter((k) => k.selesai).length;
          const isi = tampilkanSelesai ? semuaDiKolom : semuaDiKolom.filter((k) => !k.selesai);
          const menyala = kolomTujuan === fase && diseret !== null;

          return (
            <section
              key={fase}
              onDragOver={(e) => {
                // Tanpa preventDefault, browser menolak jatuhannya.
                e.preventDefault();
                setKolomTujuan(fase);
              }}
              onDragLeave={() => setKolomTujuan((k) => (k === fase ? null : k))}
              onDrop={(e) => {
                e.preventDefault();
                const id = Number(e.dataTransfer.getData('text/plain'));
                setKolomTujuan(null);
                setDiseret(null);
                if (Number.isInteger(id)) pindah(id, fase);
              }}
              className={cn(
                'flex w-68 shrink-0 flex-col rounded-lg border p-2 transition-colors',
                menyala ? 'border-terracotta bg-terracotta-lembut' : 'border-garis bg-permukaan/60',
              )}
            >
              <header className="px-1.5 pt-1 pb-2">
                <h2 className="text-xs leading-tight font-medium">{LABEL_FASE[fase]}</h2>
                <p className="angka mt-0.5 text-[11px] text-tinta-samar">
                  {semuaDiKolom.length === 0
                    ? 'kosong'
                    : `${selesai}/${semuaDiKolom.length} selesai`}
                </p>
              </header>

              <ul className="flex flex-1 flex-col gap-2">
                {isi.map((k) => (
                  <Kartu
                    key={k.id}
                    kartu={k}
                    sedangDiseret={diseret === k.id}
                    onMulaiSeret={() => setDiseret(k.id)}
                    onSelesaiSeret={() => {
                      setDiseret(null);
                      setKolomTujuan(null);
                    }}
                    onPindah={(arah) => {
                      const i = URUTAN_FASE.indexOf(fase);
                      const tujuan = URUTAN_FASE[i + arah];
                      if (tujuan) pindah(k.id, tujuan);
                    }}
                    bisaKiri={URUTAN_FASE.indexOf(fase) > 0}
                    bisaKanan={URUTAN_FASE.indexOf(fase) < URUTAN_FASE.length - 1}
                  />
                ))}

                {isi.length === 0 && (
                  <li className="rounded-md border border-dashed border-garis px-3 py-6 text-center text-xs text-tinta-samar">
                    {semuaDiKolom.length === 0 ? 'Tidak ada task' : 'Semua selesai'}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Kartu({
  kartu,
  sedangDiseret,
  onMulaiSeret,
  onSelesaiSeret,
  onPindah,
  bisaKiri,
  bisaKanan,
}: {
  kartu: KartuTask;
  sedangDiseret: boolean;
  onMulaiSeret: () => void;
  onSelesaiSeret: () => void;
  onPindah: (arah: -1 | 1) => void;
  bisaKiri: boolean;
  bisaKanan: boolean;
}) {
  const router = useRouter();
  const [, mulai] = useTransition();
  const [selesai, setSelesai] = useOptimistic(kartu.selesai);

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(kartu.id));
        e.dataTransfer.effectAllowed = 'move';
        onMulaiSeret();
      }}
      onDragEnd={onSelesaiSeret}
      className={cn(
        'kartu group cursor-grab px-3 py-2.5 active:cursor-grabbing',
        sedangDiseret && 'opacity-40',
        selesai && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={selesai ? `Batalkan ${kartu.judul}` : `Tandai selesai ${kartu.judul}`}
          aria-pressed={selesai}
          onClick={() =>
            mulai(async () => {
              setSelesai(!selesai);
              await toggleTask(kartu.id, !selesai);
              router.refresh();
            })
          }
          className={cn(
            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
            selesai ? 'border-sage bg-sage text-white' : 'border-garis-kuat text-transparent',
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </button>

        <p className={cn('flex-1 text-xs leading-snug', selesai && 'line-through')}>{kartu.judul}</p>

        <Link
          href={`/checklist/${kartu.id}`}
          aria-label={`Ubah ${kartu.judul}`}
          className="shrink-0 text-tinta-samar opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Pencil className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-6">
        <span className="min-w-0 text-[11px] text-tinta-samar">
          <span className={kartu.telat && !selesai ? 'text-bahaya' : undefined}>
            {kartu.keterangan}
          </span>
          {kartu.assignee !== 'berdua' && ` · ${LABEL_PIHAK[kartu.assignee]}`}
          {kartu.terkunci && (
            <span title="Tanggalnya dikunci manual, tidak ikut bergeser saat pindah kolom">
              {' '}
              <Lock className="inline size-2.5" />
            </span>
          )}
        </span>

        {/* Alternatif drag yang bisa dijangkau keyboard. */}
        <span className="flex shrink-0 gap-0.5">
          <TombolGeser arah={-1} bisa={bisaKiri} judul={kartu.judul} onPindah={onPindah} />
          <TombolGeser arah={1} bisa={bisaKanan} judul={kartu.judul} onPindah={onPindah} />
        </span>
      </div>
    </li>
  );
}

function TombolGeser({
  arah,
  bisa,
  judul,
  onPindah,
}: {
  arah: -1 | 1;
  bisa: boolean;
  judul: string;
  onPindah: (arah: -1 | 1) => void;
}) {
  const Ikon = arah === -1 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={!bisa}
      aria-label={`Pindahkan ${judul} ke fase ${arah === -1 ? 'sebelumnya' : 'berikutnya'}`}
      onClick={() => onPindah(arah)}
      className="rounded text-tinta-samar hover:bg-garis hover:text-tinta disabled:opacity-25 disabled:hover:bg-transparent"
    >
      <Ikon className="size-4" />
    </button>
  );
}
