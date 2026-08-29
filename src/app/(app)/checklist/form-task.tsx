'use client';

import { useActionState } from 'react';
import type { Task } from '@/db/schema';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { LABEL_FASE, URUTAN_FASE } from '@/lib/timeline';
import type { HasilAksi } from '@/lib/validators';
import { buatTask, ubahTask } from './actions';

export function FormTask({ awal, dueOtomatis }: { awal?: Task; dueOtomatis?: string | null }) {
  const aksiTersimpan = awal
    ? ubahTask.bind(null, awal.id)
    : (buatTask as (p: HasilAksi | null, f: FormData) => Promise<HasilAksi>);
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(aksiTersimpan, null);

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field label="Judul">
        <Input name="judul" defaultValue={awal?.judul ?? ''} required maxLength={200} autoFocus={!awal} />
      </Field>

      <Field label="Catatan">
        <Textarea name="deskripsi" defaultValue={awal?.deskripsi ?? ''} maxLength={1000} />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Fase">
          <Select name="fase" defaultValue={awal?.fase ?? 'pra'}>
            {URUTAN_FASE.map((f) => (
              <option key={f} value={f}>
                {LABEL_FASE[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Siapa">
          <Select name="assignee" defaultValue={awal?.assignee ?? 'berdua'}>
            <option value="berdua">Berdua</option>
            <option value="pria">Mempelai pria</option>
            <option value="wanita">Mempelai wanita</option>
          </Select>
        </Field>
      </div>

      <Field label="Kategori">
        <Input name="kategori" defaultValue={awal?.kategori ?? ''} maxLength={40} />
      </Field>

      <Field
        label="Jatuh tempo sendiri"
        hint={
          dueOtomatis
            ? `Kosongkan untuk memakai tanggal otomatis (${dueOtomatis}).`
            : 'Kosongkan kalau tidak perlu tanggal khusus.'
        }
      >
        <Input name="dueDateOverride" type="date" defaultValue={awal?.dueDateOverride ?? ''} />
      </Field>

      <TombolSimpan className="w-full" size="lg">
        {awal ? 'Simpan perubahan' : 'Tambah task'}
      </TombolSimpan>
      <PesanAksi hasil={hasil} />
    </form>
  );
}
