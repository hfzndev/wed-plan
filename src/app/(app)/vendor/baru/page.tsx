import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormVendor } from '../form-vendor';

export const runtime = 'nodejs';

export default function HalamanVendorBaru() {
  return (
    <>
      <TautanKembali href="/vendor" label="Vendor" />
      <KepalaHalaman judul="Vendor baru" />
      <FormVendor />
      <div className="h-6" />
    </>
  );
}
