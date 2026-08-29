'use client';

import { useFormStatus } from 'react-dom';
import { Check, AlertCircle } from 'lucide-react';
import { Button, type ButtonProps } from './button';
import type { HasilAksi } from '@/lib/validators';

/** Tombol submit yang tahu kapan form-nya sedang dikirim. */
export function TombolSimpan({ children = 'Simpan', ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? 'Menyimpan…' : children}
    </Button>
  );
}

export function PesanAksi({ hasil, sukses = 'Tersimpan.' }: { hasil: HasilAksi | null; sukses?: string }) {
  if (!hasil) return null;
  if (hasil.ok) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm text-sage">
        <Check className="size-4" /> {sukses}
      </p>
    );
  }
  return (
    <p className="mt-3 flex items-start gap-1.5 text-sm text-bahaya">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {hasil.pesan}
    </p>
  );
}
