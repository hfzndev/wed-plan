'use client';

import { useActionState } from 'react';
import type { Vendor } from '@/db/schema';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { OPSI_KATEGORI, OPSI_STATUS_VENDOR } from '@/lib/label';
import { angka } from '@/lib/money';
import type { HasilAksi } from '@/lib/validators';
import { buatVendor, ubahVendor } from './actions';

export function FormVendor({ awal }: { awal?: Vendor }) {
  const aksiTersimpan = awal
    ? ubahVendor.bind(null, awal.id)
    : (buatVendor as (p: HasilAksi | null, f: FormData) => Promise<HasilAksi>);
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(aksiTersimpan, null);

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field label="Nama vendor">
        <Input name="nama" defaultValue={awal?.nama ?? ''} required maxLength={200} autoFocus={!awal} />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Kategori">
          <Select name="kategori" defaultValue={awal?.kategori ?? 'lain'}>
            {OPSI_KATEGORI.map((o) => (
              <option key={o.nilai} value={o.nilai}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={awal?.status ?? 'shortlist'}>
            {OPSI_STATUS_VENDOR.map((o) => (
              <option key={o.nilai} value={o.nilai}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Harga penawaran (Rp)" hint="Angka dari quotation, sebelum nego.">
        <Input
          name="hargaPenawaran"
          inputMode="numeric"
          className="angka"
          defaultValue={awal?.hargaPenawaran ? angka(awal.hargaPenawaran) : ''}
        />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Nama kontak">
          <Input name="kontakNama" defaultValue={awal?.kontakNama ?? ''} maxLength={80} />
        </Field>
        <Field label="WhatsApp" hint="Contoh: 08123456789">
          <Input
            name="whatsapp"
            inputMode="tel"
            defaultValue={awal?.whatsapp ?? ''}
            maxLength={30}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Instagram" hint="Tanpa tanda @">
          <Input name="instagram" defaultValue={awal?.instagram ?? ''} maxLength={80} />
        </Field>
        <Field label="Lokasi">
          <Input name="lokasi" defaultValue={awal?.lokasi ?? ''} maxLength={120} />
        </Field>
      </div>

      <Field label="Website">
        <Input name="website" type="url" defaultValue={awal?.website ?? ''} maxLength={200} />
      </Field>

      <Field label="Penilaian kalian">
        <Select name="rating" defaultValue={awal?.rating ? String(awal.rating) : ''}>
          <option value="">Belum dinilai</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </Select>
      </Field>

      <Field label="Catatan" hint="Isi paket, yang belum termasuk, hasil nego, kesan saat survei.">
        <Textarea name="catatan" defaultValue={awal?.catatan ?? ''} maxLength={2000} className="min-h-28" />
      </Field>

      <TombolSimpan className="w-full" size="lg">
        {awal ? 'Simpan perubahan' : 'Tambah vendor'}
      </TombolSimpan>
      <PesanAksi hasil={hasil} />
    </form>
  );
}
