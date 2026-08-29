'use client';

import { useActionState } from 'react';
import type { DocumentRow } from '@/db/schema';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { buatDokumen, ubahDokumen } from './actions';

export function FormDokumen({ awal }: { awal?: DocumentRow }) {
  const aksiTersimpan = awal
    ? ubahDokumen.bind(null, awal.id)
    : (buatDokumen as (p: HasilAksi | null, f: FormData) => Promise<HasilAksi>);
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(aksiTersimpan, null);

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field label="Nama dokumen">
        <Input name="nama" defaultValue={awal?.nama ?? ''} required maxLength={200} autoFocus={!awal} />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Untuk siapa">
          <Select name="pihak" defaultValue={awal?.pihak ?? 'berdua'}>
            <option value="pria">Mempelai pria</option>
            <option value="wanita">Mempelai wanita</option>
            <option value="berdua">Berdua</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={awal?.status ?? 'belum'}>
            <option value="belum">Belum diurus</option>
            <option value="proses">Sedang diurus</option>
            <option value="selesai">Selesai</option>
          </Select>
        </Field>
      </div>

      <Field label="Instansi" hint="RT/RW, Kelurahan, KUA, Puskesmas, dan seterusnya.">
        <Input name="instansi" defaultValue={awal?.instansi ?? ''} maxLength={120} />
      </Field>

      <Field label="Target selesai">
        <Input name="deadline" type="date" defaultValue={awal?.deadline ?? ''} />
      </Field>

      <Field label="Catatan">
        <Textarea name="catatan" defaultValue={awal?.catatan ?? ''} maxLength={1000} />
      </Field>

      <TombolSimpan className="w-full" size="lg">
        {awal ? 'Simpan perubahan' : 'Tambah dokumen'}
      </TombolSimpan>
      <PesanAksi hasil={hasil} />
    </form>
  );
}
