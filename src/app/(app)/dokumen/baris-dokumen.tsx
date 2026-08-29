'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/cn';
import { putarStatusDokumen } from './actions';

type Status = 'belum' | 'proses' | 'selesai';

const BERIKUTNYA: Record<Status, Status> = {
  belum: 'proses',
  proses: 'selesai',
  selesai: 'belum',
};

const LABEL: Record<Status, string> = {
  belum: 'Belum diurus',
  proses: 'Sedang diurus',
  selesai: 'Selesai',
};

export function BarisDokumen({
  id,
  nama,
  status,
  instansi,
  catatan,
  keterangan,
  telat,
}: {
  id: number;
  nama: string;
  status: Status;
  instansi: string;
  catatan: string;
  keterangan: string | null;
  telat: boolean;
}) {
  const router = useRouter();
  const [, mulai] = useTransition();
  const [optimis, setOptimis] = useOptimistic(status);

  return (
    <li className="flex items-start gap-3 border-b border-garis px-5 py-3">
      <button
        type="button"
        aria-label={`${nama}: ${LABEL[optimis]}. Ketuk untuk ubah status.`}
        onClick={() =>
          mulai(async () => {
            const next = BERIKUTNYA[optimis];
            setOptimis(next);
            await putarStatusDokumen(id, next);
            router.refresh();
          })
        }
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          optimis === 'selesai' && 'border-sage bg-sage text-white',
          optimis === 'proses' && 'border-terracotta text-terracotta',
          optimis === 'belum' && 'border-garis-kuat text-transparent',
        )}
      >
        {optimis === 'selesai' ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : optimis === 'proses' ? (
          <CircleDot className="size-3" />
        ) : (
          <Circle className="size-3" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', optimis === 'selesai' && 'text-tinta-samar')}>{nama}</p>
        <p className="mt-0.5 text-xs text-tinta-samar">
          {LABEL[optimis]}
          {instansi && instansi !== '—' && ` · ${instansi}`}
          {keterangan && (
            <span className={telat && optimis !== 'selesai' ? 'text-bahaya' : undefined}>
              {' '}
              · {keterangan}
            </span>
          )}
        </p>
        {catatan && <p className="mt-1 text-xs leading-relaxed text-tinta-samar">{catatan}</p>}
      </div>

      <Link
        href={`/dokumen/${id}`}
        aria-label={`Ubah ${nama}`}
        className="mt-0.5 shrink-0 text-tinta-samar"
      >
        <Pencil className="size-4" />
      </Link>
    </li>
  );
}
