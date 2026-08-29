import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { ambilSettings } from '@/lib/pengaturan';
import { FormAcara } from '../form-acara';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanAcara() {
  const settings = await ambilSettings();

  return (
    <>
      <TautanKembali href="/pengaturan" label="Pengaturan" />
      <KepalaHalaman
        judul="Mempelai & acara"
        ket="Tanggal resepsi di sini yang menghitung seluruh jatuh tempo di Checklist."
      />
      <FormAcara awal={settings} />
      <div className="h-8" />
    </>
  );
}
