'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { angka } from '@/lib/money';
import { hariIni } from '@/lib/timeline';
import type { HasilAksi } from '@/lib/validators';
import { buatPembayaran } from '../actions';

export function FormPembayaran({
  budgetItemId,
  sisaBelumTerjadwal,
}: {
  budgetItemId: number;
  sisaBelumTerjadwal: number;
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Menutup panel di dalam aksi, bukan di useEffect — setState dalam effect
  // memicu render berantai.
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await buatPembayaran(prev, data);
    if (r.ok) {
      formRef.current?.reset();
      setTerbuka(false);
      router.refresh();
    }
    return r;
  }, null);

  if (!terbuka) {
    return (
      <div className="mx-5 md:max-w-2xl">
        <Button variant="garis" className="w-full" onClick={() => setTerbuka(true)}>
          <Plus /> Tambah pembayaran
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <input type="hidden" name="budgetItemId" value={budgetItemId} />

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Jenis">
          <Select name="jenis" defaultValue="dp">
            <option value="dp">DP</option>
            <option value="termin">Termin</option>
            <option value="pelunasan">Pelunasan</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="belum">
            <option value="belum">Belum dibayar</option>
            <option value="lunas">Sudah dibayar</option>
          </Select>
        </Field>
      </div>

      <Field
        label="Jumlah (Rp)"
        hint={sisaBelumTerjadwal > 0 ? `Sisa yang belum terjadwal: ${angka(sisaBelumTerjadwal)}` : undefined}
      >
        <Input
          name="jumlah"
          inputMode="numeric"
          className="angka"
          defaultValue={sisaBelumTerjadwal > 0 ? angka(sisaBelumTerjadwal) : ''}
          required
        />
      </Field>

      <Field label="Jatuh tempo">
        <Input name="jatuhTempo" type="date" defaultValue={hariIni()} required />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Metode">
          <Input name="metode" placeholder="Transfer BCA" maxLength={60} />
        </Field>
        <Field label="Catatan">
          <Input name="catatan" maxLength={500} />
        </Field>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="halus" onClick={() => setTerbuka(false)}>
          Batal
        </Button>
        <TombolSimpan className="flex-1">Tambah</TombolSimpan>
      </div>
      <PesanAksi hasil={hasil} />
    </form>
  );
}
