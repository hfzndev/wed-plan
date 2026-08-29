import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { sessionSaatIni } from '@/lib/auth';
import { FormPassword } from '../form-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanKeamanan() {
  const session = await sessionSaatIni();

  return (
    <>
      <TautanKembali href="/pengaturan" label="Pengaturan" />
      <KepalaHalaman
        judul="Keamanan"
        ket={`Mengganti password akun ${session?.user?.email ?? 'ini'} saja, bukan akun pasanganmu.`}
      />
      <FormPassword />
      <div className="h-8" />
    </>
  );
}
