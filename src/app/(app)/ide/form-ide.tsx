'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { hariIni } from '@/lib/timeline';
import { cn } from '@/lib/cn';
import type { HasilAksi } from '@/lib/validators';
import { buatIde, buatKeputusan, toggleFavorit, hapusIde, hapusKeputusan } from './actions';

/**
 * Bungkus server action supaya panel menutup sendiri saat berhasil.
 * Sengaja tidak lewat useEffect — setState di dalam effect memicu render berantai.
 */
function useFormTertutup(
  aksiAsli: (prev: HasilAksi | null, data: FormData) => Promise<HasilAksi>,
  tutup: () => void,
) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await aksiAsli(prev, data);
    if (r.ok) {
      formRef.current?.reset();
      tutup();
      router.refresh();
    }
    return r;
  }, null);

  return { formRef, hasil, aksi };
}

export function TambahIde() {
  const [terbuka, setTerbuka] = useState(false);
  const { formRef, hasil, aksi } = useFormTertutup(buatIde, () => setTerbuka(false));

  if (!terbuka) {
    return (
      <div className="mx-5 mt-4 md:max-w-2xl">
        <Button variant="garis" className="w-full" onClick={() => setTerbuka(true)}>
          <Plus /> Simpan ide
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={aksi} className="kartu mx-5 mt-4 p-5 md:max-w-2xl">
      <Field label="Judul">
        <Input name="judul" required maxLength={200} autoFocus />
      </Field>
      <Field label="Link" hint="Tempel URL Instagram, Pinterest, atau katalog vendor.">
        <Input name="url" type="url" maxLength={500} />
      </Field>
      <Field label="Kategori" hint="Dekorasi, busana, undangan, dan sebagainya.">
        <Input name="kategori" maxLength={40} />
      </Field>
      <Field label="Catatan">
        <Textarea name="catatan" maxLength={1000} />
      </Field>
      <div className="flex gap-2">
        <Button type="button" variant="halus" onClick={() => setTerbuka(false)}>
          Batal
        </Button>
        <TombolSimpan className="flex-1">Simpan</TombolSimpan>
      </div>
      <PesanAksi hasil={hasil} />
    </form>
  );
}

export function TambahKeputusan() {
  const [terbuka, setTerbuka] = useState(false);
  const { formRef, hasil, aksi } = useFormTertutup(buatKeputusan, () => setTerbuka(false));

  if (!terbuka) {
    return (
      <div className="mx-5 mt-4 md:max-w-2xl">
        <Button variant="garis" className="w-full" onClick={() => setTerbuka(true)}>
          <Plus /> Catat keputusan
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={aksi} className="kartu mx-5 mt-4 p-5 md:max-w-2xl">
      <Field label="Topik" hint="Contoh: jumlah tamu, warna seragam keluarga.">
        <Input name="topik" required maxLength={200} autoFocus />
      </Field>
      <Field label="Keputusannya">
        <Textarea name="keputusan" required maxLength={1000} />
      </Field>
      <Field label="Alasan" hint="Bagian ini yang menyelamatkan kalian dari mengulang debat yang sama.">
        <Textarea name="alasan" maxLength={1000} />
      </Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Tanggal">
          <Input name="tanggal" type="date" defaultValue={hariIni()} required />
        </Field>
        <Field label="Diputuskan oleh">
          <Select name="oleh" defaultValue="berdua">
            <option value="berdua">Berdua</option>
            <option value="pria">Mempelai pria</option>
            <option value="wanita">Mempelai wanita</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="halus" onClick={() => setTerbuka(false)}>
          Batal
        </Button>
        <TombolSimpan className="flex-1">Simpan</TombolSimpan>
      </div>
      <PesanAksi hasil={hasil} />
    </form>
  );
}

export function TombolFavorit({ id, favorit }: { id: number; favorit: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={favorit ? 'Hapus dari favorit' : 'Tandai favorit'}
      aria-pressed={favorit}
      className="shrink-0 p-1"
      onClick={async () => {
        await toggleFavorit(id);
        router.refresh();
      }}
    >
      <Star
        className={cn('size-4', favorit ? 'fill-terracotta text-terracotta' : 'text-tinta-samar')}
      />
    </button>
  );
}

export function TombolHapus({
  id,
  label,
  jenis,
}: {
  id: number;
  label: string;
  jenis: 'ide' | 'keputusan';
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={`Hapus ${label}`}
      className="shrink-0 p-1 text-tinta-samar"
      onClick={async () => {
        if (!confirm(`Hapus "${label}"?`)) return;
        if (jenis === 'ide') await hapusIde(id);
        else await hapusKeputusan(id);
        router.refresh();
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
