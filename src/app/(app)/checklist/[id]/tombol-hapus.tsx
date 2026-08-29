'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapusTask } from '../actions';

export function TombolHapusTask({ id, judul }: { id: number; judul: string }) {
  const [pending, mulai] = useTransition();

  return (
    <Button
      variant="bahaya"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus task "${judul}"?`)) return;
        mulai(async () => {
          await hapusTask(id);
        });
      }}
    >
      <Trash2 /> Hapus task ini
    </Button>
  );
}
