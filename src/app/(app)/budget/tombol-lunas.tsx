'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { tandaiPembayaran } from './actions';

export function TombolLunas({ id, lunas }: { id: number; lunas: boolean }) {
  const router = useRouter();
  const [pending, mulai] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={lunas ? 'Tandai belum dibayar' : 'Tandai lunas'}
      aria-pressed={lunas}
      onClick={() =>
        mulai(async () => {
          await tandaiPembayaran(id, !lunas);
          router.refresh();
        })
      }
      className={cn(
        'flex size-7 items-center justify-center rounded-full border transition-colors',
        lunas ? 'border-sage bg-sage text-white' : 'border-garis-kuat text-transparent',
        pending && 'opacity-50',
      )}
    >
      <Check className="size-4" strokeWidth={3} />
    </button>
  );
}
