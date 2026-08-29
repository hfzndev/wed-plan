'use client';

import { useActionState } from 'react';
import { Field, Input } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { gantiPassword } from './actions';

export function FormPassword() {
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(gantiPassword, null);

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field label="Password lama">
        <Input name="passwordLama" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Password baru" hint="Minimal 8 karakter.">
        <Input name="passwordBaru" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Ulangi password baru">
        <Input name="konfirmasi" type="password" autoComplete="new-password" required />
      </Field>
      <TombolSimpan className="w-full" size="lg">
        Ganti password
      </TombolSimpan>
      <PesanAksi hasil={hasil} sukses="Password diganti." />
    </form>
  );
}
