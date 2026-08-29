'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { OPSI_KATEGORI_SESERAHAN } from '@/lib/label';
import { cn } from '@/lib/cn';
import type { HasilAksi } from '@/lib/validators';
import { buatSeserahan, toggleDibeli, hapusSeserahan } from './actions';

export function TambahSeserahan() {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await buatSeserahan(prev, data);
    if (r.ok) {
      formRef.current?.reset();
      setTerbuka(false);
      router.refresh();
    }
    return r;
  }, null);

  if (!terbuka) {
    return (
      <div className="mx-5 mt-4 md:max-w-2xl">
        <Button variant="garis" className="w-full" onClick={() => setTerbuka(true)}>
          <Plus /> Tambah barang
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={aksi} className="kartu mx-5 mt-4 p-5 md:max-w-2xl">
      <Field label="Nama barang">
        <Input name="nama" required maxLength={200} autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Kategori">
          <Select name="kategori" defaultValue="lain">
            {OPSI_KATEGORI_SESERAHAN.map((o) => (
              <option key={o.nilai} value={o.nilai}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="belum">
            <option value="belum">Belum dibeli</option>
            <option value="dibeli">Sudah dibeli</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Estimasi (Rp)">
          <Input name="estimasi" inputMode="numeric" className="angka" />
        </Field>
        <Field label="Aktual (Rp)">
          <Input name="aktual" inputMode="numeric" className="angka" placeholder="Kalau sudah beli" />
        </Field>
      </div>

      <Field label="Catatan">
        <Input name="catatan" maxLength={500} />
      </Field>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" name="isMahar" value="true" className="size-4" />
        Ini bagian dari mahar
      </label>

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

export function TombolDibeli({ id, dibeli, nama }: { id: number; dibeli: boolean; nama: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={dibeli ? `Tandai ${nama} belum dibeli` : `Tandai ${nama} sudah dibeli`}
      aria-pressed={dibeli}
      onClick={async () => {
        await toggleDibeli(id);
        router.refresh();
      }}
      className={cn(
        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
        dibeli ? 'border-sage bg-sage text-white' : 'border-garis-kuat text-transparent',
      )}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </button>
  );
}

export function TombolHapusSeserahan({ id, nama }: { id: number; nama: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={`Hapus ${nama}`}
      className="shrink-0 p-1 text-tinta-samar"
      onClick={async () => {
        if (!confirm(`Hapus "${nama}" dari daftar?`)) return;
        await hapusSeserahan(id);
        router.refresh();
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
