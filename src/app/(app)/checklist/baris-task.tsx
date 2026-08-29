'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LABEL_PIHAK } from '@/lib/label';
import { toggleTask } from './actions';

export function BarisTask({
  id,
  judul,
  deskripsi,
  assignee,
  selesai,
  keterangan,
  telat,
}: {
  id: number;
  judul: string;
  deskripsi: string;
  assignee: 'pria' | 'wanita' | 'berdua';
  selesai: boolean;
  keterangan: string;
  telat: boolean;
}) {
  const router = useRouter();
  const [, mulai] = useTransition();
  // Centang harus terasa instan; hasil sebenarnya menyusul lewat refresh.
  const [optimis, setOptimis] = useOptimistic(selesai);

  return (
    <li className="flex items-start gap-3 border-b border-garis px-5 py-3">
      <button
        type="button"
        aria-label={optimis ? `Batalkan ${judul}` : `Tandai selesai ${judul}`}
        aria-pressed={optimis}
        onClick={() =>
          mulai(async () => {
            setOptimis(!optimis);
            await toggleTask(id, !optimis);
            router.refresh();
          })
        }
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
          optimis ? 'border-sage bg-sage text-white' : 'border-garis-kuat text-transparent',
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', optimis && 'text-tinta-samar line-through')}>{judul}</p>
        {deskripsi && !optimis && (
          <p className="mt-0.5 text-xs leading-relaxed text-tinta-samar">{deskripsi}</p>
        )}
        <p className="mt-1 text-xs text-tinta-samar">
          <span className={telat && !optimis ? 'text-bahaya' : undefined}>{keterangan}</span>
          {assignee !== 'berdua' && ` · ${LABEL_PIHAK[assignee]}`}
        </p>
      </div>

      <Link
        href={`/checklist/${id}`}
        aria-label={`Ubah ${judul}`}
        className="mt-0.5 shrink-0 text-tinta-samar"
      >
        <Pencil className="size-4" />
      </Link>
    </li>
  );
}
