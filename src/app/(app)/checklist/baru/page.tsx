import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormTask } from '../form-task';

export const runtime = 'nodejs';

export default function HalamanTaskBaru() {
  return (
    <>
      <TautanKembali href="/checklist" label="Checklist" />
      <KepalaHalaman
        judul="Task baru"
        ket="Task buatan sendiri tidak ikut hitungan mundur template — pakai jatuh tempo sendiri kalau perlu tanggal."
      />
      <FormTask />
      <div className="h-6" />
    </>
  );
}
