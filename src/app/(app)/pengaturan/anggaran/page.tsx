import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { ambilSettings } from '@/lib/pengaturan';
import { FormAnggaran } from '../form-anggaran';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanAnggaran() {
  const settings = await ambilSettings();

  return (
    <>
      <TautanKembali href="/pengaturan" label="Pengaturan" />
      <KepalaHalaman
        judul="Anggaran & tamu"
        ket="Mengubah target tamu langsung mengubah seluruh biaya katering di Budget."
      />
      <FormAnggaran awal={settings} />
      <div className="h-8" />
    </>
  );
}
