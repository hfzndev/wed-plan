'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapusVendor, hapusBerkas } from '../actions';

export function TombolHapusVendor({ id, nama }: { id: number; nama: string }) {
  const [pending, mulai] = useTransition();

  return (
    <Button
      variant="bahaya"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus vendor "${nama}" beserta berkasnya?`)) return;
        mulai(async () => {
          await hapusVendor(id);
        });
      }}
    >
      <Trash2 /> Hapus vendor ini
    </Button>
  );
}

export function TombolHapusBerkas({ id, nama }: { id: number; nama: string }) {
  const router = useRouter();
  const [pending, mulai] = useTransition();

  return (
    <button
      type="button"
      aria-label={`Hapus ${nama}`}
      disabled={pending}
      className="shrink-0 text-tinta-samar disabled:opacity-40"
      onClick={() => {
        if (!confirm(`Hapus berkas "${nama}"? Tidak bisa dikembalikan.`)) return;
        mulai(async () => {
          await hapusBerkas(id);
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
