'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapusItemBudget, hapusPembayaran } from '../actions';

export function TombolHapusItem({ id, nama }: { id: number; nama: string }) {
  const [pending, mulai] = useTransition();

  return (
    <Button
      variant="bahaya"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus "${nama}" beserta seluruh jadwal pembayarannya?`)) return;
        mulai(async () => {
          await hapusItemBudget(id);
        });
      }}
    >
      <Trash2 /> Hapus item ini
    </Button>
  );
}

export function TombolHapusPembayaran({ id }: { id: number }) {
  const router = useRouter();
  const [pending, mulai] = useTransition();

  return (
    <button
      type="button"
      aria-label="Hapus pembayaran"
      disabled={pending}
      className="text-tinta-samar disabled:opacity-40"
      onClick={() => {
        if (!confirm('Hapus jadwal pembayaran ini?')) return;
        mulai(async () => {
          await hapusPembayaran(id);
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
