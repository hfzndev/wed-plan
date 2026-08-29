'use client';

import { useActionState, useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { simpanWhatsapp, kirimTesWhatsapp } from './actions';

export interface NomorAwal {
  peran: 'pria' | 'wanita';
  nama: string;
  whatsapp: string;
  waAktif: boolean;
}

export function FormWhatsapp({ awal, wahaSiap }: { awal: NomorAwal[]; wahaSiap: boolean }) {
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(simpanWhatsapp, null);
  const pria = awal.find((u) => u.peran === 'pria');
  const wanita = awal.find((u) => u.peran === 'wanita');

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      {!wahaSiap && (
        <p className="mb-4 rounded-md border border-garis-kuat bg-kertas px-3 py-2 text-xs text-tinta-lembut">
          WAHA belum dikonfigurasi. Nomor tetap bisa disimpan, tapi belum ada yang terkirim sampai
          <code className="mx-1">WAHA_BASE_URL</code> diisi di <code>.env</code>.
        </p>
      )}

      <BarisNomor label={`Nomor ${pria?.nama || 'mempelai pria'}`} prefix="Pria" awal={pria} />
      <BarisNomor label={`Nomor ${wanita?.nama || 'mempelai wanita'}`} prefix="Wanita" awal={wanita} />

      <TombolSimpan className="w-full">Simpan nomor</TombolSimpan>
      <PesanAksi hasil={hasil} sukses="Nomor tersimpan." />

      <div className="mt-5 border-t border-garis pt-4">
        <p className="label-kecil">Uji koneksi</p>
        <p className="mt-1 mb-3 text-xs text-tinta-samar">
          Simpan dulu nomornya, lalu kirim satu pesan sungguhan untuk memastikan sesi WAHA hidup.
        </p>
        <div className="flex gap-2">
          <TombolTes peran="pria" label="Tes ke pria" />
          <TombolTes peran="wanita" label="Tes ke wanita" />
        </div>
      </div>
    </form>
  );
}

function BarisNomor({
  label,
  prefix,
  awal,
}: {
  label: string;
  prefix: 'Pria' | 'Wanita';
  awal?: NomorAwal;
}) {
  return (
    <>
      <Field label={label} hint="Format 08xx atau +62 8xx. Kosongkan untuk tidak dikirimi.">
        <Input
          name={`nomor${prefix}`}
          inputMode="tel"
          defaultValue={awal?.whatsapp ?? ''}
          maxLength={30}
          placeholder="08123456789"
        />
      </Field>
      <label className="mb-4 -mt-2 flex items-center gap-2 text-sm text-tinta-lembut">
        <input
          type="checkbox"
          name={`aktif${prefix}`}
          defaultChecked={awal?.waAktif ?? true}
          className="size-4"
        />
        Kirimi reminder
      </label>
    </>
  );
}

function TombolTes({ peran, label }: { peran: 'pria' | 'wanita'; label: string }) {
  const [pending, mulai] = useTransition();
  const [hasil, setHasil] = useState<HasilAksi | null>(null);

  return (
    <div className="flex-1">
      <Button
        type="button"
        variant="garis"
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={() =>
          mulai(async () => {
            setHasil(null);
            setHasil(await kirimTesWhatsapp(peran));
          })
        }
      >
        <Send /> {pending ? 'Mengirim…' : label}
      </Button>
      <PesanAksi hasil={hasil} sukses="Terkirim. Cek HP." />
    </div>
  );
}
