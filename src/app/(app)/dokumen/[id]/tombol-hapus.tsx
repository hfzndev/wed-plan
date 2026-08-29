'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapusDokumen } from '../actions';

export function TombolHapusDokumen({ id, nama }: { id: number; nama: string }) {
  const [pending, mulai] = useTransition();

  return (
    <Button
      variant="bahaya"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus dokumen "${nama}"?`)) return;
        mulai(async () => {
          await hapusDokumen(id);
        });
      }}
    >
      <Trash2 /> Hapus dokumen ini
    </Button>
  );
}
