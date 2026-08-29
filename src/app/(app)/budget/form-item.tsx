'use client';

import { useActionState, useState } from 'react';
import type { BudgetItem } from '@/db/schema';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { OPSI_KATEGORI, type KategoriBudget } from '@/lib/label';
import { angka, rupiah, parseRupiah } from '@/lib/money';
import type { HasilAksi } from '@/lib/validators';
import { buatItemBudget, ubahItemBudget } from './actions';

export function FormItemBudget({
  awal,
  targetTamu,
  kategoriAwal,
  namaAwal,
  hargaAwal,
}: {
  awal?: BudgetItem;
  targetTamu: number;
  kategoriAwal?: KategoriBudget;
  namaAwal?: string;
  hargaAwal?: number;
}) {
  const aksiTersimpan = awal
    ? ubahItemBudget.bind(null, awal.id)
    : (buatItemBudget as (p: HasilAksi | null, f: FormData) => Promise<HasilAksi>);
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(aksiTersimpan, null);

  const [tipe, setTipe] = useState<'lumpsum' | 'per_pax'>(awal?.tipe ?? 'lumpsum');
  const [harga, setHarga] = useState(
    awal ? angka(awal.hargaSatuan) : hargaAwal ? angka(hargaAwal) : '',
  );
  const [qty, setQty] = useState(awal ? String(awal.qty) : '1');

  const nilaiHarga = parseRupiah(harga);
  const pengali = tipe === 'per_pax' ? targetTamu : Math.max(1, Number(qty) || 1);
  const estimasi = nilaiHarga * pengali;

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field label="Nama item">
        <Input name="nama" defaultValue={awal?.nama ?? namaAwal ?? ''} required maxLength={200} autoFocus={!awal} />
      </Field>

      <Field label="Kategori">
        <Select name="kategori" defaultValue={awal?.kategori ?? kategoriAwal ?? 'lain'}>
          {OPSI_KATEGORI.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Cara hitung"
        hint={
          tipe === 'per_pax'
            ? `Dikali target tamu (${angka(targetTamu)} orang) setiap kali ditampilkan.`
            : 'Harga tetap, dikali jumlah unit.'
        }
      >
        <Select name="tipe" value={tipe} onChange={(e) => setTipe(e.target.value as typeof tipe)}>
          <option value="lumpsum">Lumpsum</option>
          <option value="per_pax">Per orang (pax)</option>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label={tipe === 'per_pax' ? 'Harga per orang (Rp)' : 'Harga satuan (Rp)'}>
          <Input
            name="hargaSatuan"
            inputMode="numeric"
            className="angka"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
          />
        </Field>
        <Field label="Jumlah unit">
          <Input
            name="qty"
            inputMode="numeric"
            className="angka disabled:bg-kertas"
            value={tipe === 'per_pax' ? String(targetTamu) : qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={tipe === 'per_pax'}
          />
        </Field>
      </div>

      <p className="-mt-1 mb-4 text-sm text-tinta-lembut">
        Estimasi <span className="angka text-tinta">{rupiah(estimasi)}</span>
        {tipe === 'per_pax' && targetTamu === 0 && (
          <span className="block text-xs text-bahaya">
            Target tamu masih 0 — isi dulu di Pengaturan supaya angkanya bermakna.
          </span>
        )}
      </p>

      <Field
        label="Biaya aktual (Rp)"
        hint="Isi setelah harga final disepakati. Angka ini yang dipakai menghitung sisa dana."
      >
        <Input
          name="aktual"
          inputMode="numeric"
          className="angka"
          defaultValue={awal?.aktual !== null && awal?.aktual !== undefined ? angka(awal.aktual) : ''}
          placeholder="Kosongkan kalau belum fix"
        />
      </Field>

      <Field label="Vendor">
        <Input name="vendorNama" defaultValue={awal?.vendorNama ?? ''} maxLength={120} />
      </Field>

      <Field label="Catatan">
        <Textarea name="catatan" defaultValue={awal?.catatan ?? ''} maxLength={1000} />
      </Field>

      <TombolSimpan className="w-full" size="lg">
        {awal ? 'Simpan perubahan' : 'Tambah item'}
      </TombolSimpan>
      <PesanAksi hasil={hasil} />
    </form>
  );
}
