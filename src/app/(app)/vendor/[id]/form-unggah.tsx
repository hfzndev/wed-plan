'use client';

import { useActionState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import type { HasilAksi } from '@/lib/validators';
import { unggahBerkas } from './unggah-actions';

export function FormUnggah({ vendorId }: { vendorId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(async (prev, data) => {
    const r = await unggahBerkas(prev, data);
    if (r.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    return r;
  }, null);

  return (
    <form ref={formRef} action={aksi} className="mt-4 border-t border-garis pt-4">
      <input type="hidden" name="vendorId" value={vendorId} />
      <input
        type="file"
        name="berkas"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
        className="w-full text-sm text-tinta-lembut file:mr-3 file:rounded-md file:border file:border-garis-kuat file:bg-permukaan file:px-3 file:py-1.5 file:text-sm file:text-tinta"
      />
      <p className="mt-1.5 text-xs text-tinta-samar">PDF atau gambar, maksimal 10 MB.</p>
      <TombolSimpan variant="garis" size="sm" className="mt-3">
        <Upload /> Unggah
      </TombolSimpan>
      <PesanAksi hasil={hasil} sukses="Berkas tersimpan." />
    </form>
  );
}
