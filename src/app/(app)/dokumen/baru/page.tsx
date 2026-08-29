import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormDokumen } from '../form-dokumen';

export const runtime = 'nodejs';

export default function HalamanDokumenBaru() {
  return (
    <>
      <TautanKembali href="/dokumen" label="Dokumen" />
      <KepalaHalaman judul="Dokumen baru" />
      <FormDokumen />
      <div className="h-6" />
    </>
  );
}
