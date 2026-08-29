'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import type { RundownItem } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { buatRundown, ubahRundown, hapusRundown } from './actions';

export function TambahRundown({ acara }: { acara: 'akad' | 'resepsi' }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Menutup panel di dalam aksi, bukan lewat useEffect — setState dalam effect
  // memicu render berantai.
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await buatRundown(prev, data);
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
          <Plus /> Tambah kegiatan
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={aksi} className="kartu mx-5 mt-4 p-5 md:max-w-2xl">
      <input type="hidden" name="acara" value={acara} />
      <IsiFormRundown />
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

export function UbahRundown({ item, onSelesai }: { item: RundownItem; onSelesai: () => void }) {
  const router = useRouter();

  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await ubahRundown(item.id, prev, data);
    if (r.ok) {
      onSelesai();
      router.refresh();
    }
    return r;
  }, null);

  return (
    <form action={aksi} className="border-b border-garis bg-permukaan px-5 py-4">
      <input type="hidden" name="acara" value={item.acara} />
      <IsiFormRundown awal={item} />
      <div className="flex items-center gap-2">
        <Button type="button" variant="halus" onClick={onSelesai}>
          Batal
        </Button>
        <TombolSimpan className="flex-1">Simpan</TombolSimpan>
        <TombolHapusRundown id={item.id} kegiatan={item.kegiatan} />
      </div>
      <PesanAksi hasil={hasil} />
    </form>
  );
}

function IsiFormRundown({ awal }: { awal?: RundownItem }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Mulai">
          <Input name="waktuMulai" type="time" defaultValue={awal?.waktuMulai ?? '08:00'} required />
        </Field>
        <Field label="Selesai">
          <Input name="waktuSelesai" type="time" defaultValue={awal?.waktuSelesai ?? ''} />
        </Field>
      </div>
      <Field label="Kegiatan">
        <Input name="kegiatan" defaultValue={awal?.kegiatan ?? ''} required maxLength={200} />
      </Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="PIC">
          <Input name="pic" defaultValue={awal?.pic ?? ''} maxLength={80} />
        </Field>
        <Field label="Catatan">
          <Input name="catatan" defaultValue={awal?.catatan ?? ''} maxLength={500} />
        </Field>
      </div>
    </>
  );
}

function TombolHapusRundown({ id, kegiatan }: { id: number; kegiatan: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={`Hapus ${kegiatan}`}
      className="p-2 text-tinta-samar"
      onClick={async () => {
        if (!confirm(`Hapus "${kegiatan}" dari rundown?`)) return;
        await hapusRundown(id);
        router.refresh();
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
