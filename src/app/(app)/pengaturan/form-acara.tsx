'use client';

import { useActionState } from 'react';
import type { Settings } from '@/db/schema';
import { Field, Input } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { simpanAcara } from './actions';

export function FormAcara({ awal }: { awal: Settings }) {
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(simpanAcara, null);

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Nama mempelai pria">
          <Input name="namaPria" defaultValue={awal.namaPria} maxLength={80} />
        </Field>
        <Field label="Nama mempelai wanita">
          <Input name="namaWanita" defaultValue={awal.namaWanita} maxLength={80} />
        </Field>
      </div>

      <h2 className="mt-2 mb-3 border-t border-garis pt-4 text-sm font-medium">Akad</h2>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Tanggal">
          <Input name="tanggalAkad" type="date" defaultValue={awal.tanggalAkad ?? ''} />
        </Field>
        <Field label="Venue">
          <Input name="venueAkad" defaultValue={awal.venueAkad} maxLength={160} />
        </Field>
      </div>

      <h2 className="mt-2 mb-3 border-t border-garis pt-4 text-sm font-medium">Resepsi</h2>
      <div className="grid grid-cols-2 gap-x-3">
        <Field
          label="Tanggal"
          hint="Semua jatuh tempo di Checklist dihitung mundur dari tanggal ini."
        >
          <Input name="tanggalResepsi" type="date" defaultValue={awal.tanggalResepsi ?? ''} />
        </Field>
        <Field label="Venue">
          <Input name="venueResepsi" defaultValue={awal.venueResepsi} maxLength={160} />
        </Field>
      </div>

      <TombolSimpan className="w-full" size="lg" />
      <PesanAksi hasil={hasil} />
    </form>
  );
}
