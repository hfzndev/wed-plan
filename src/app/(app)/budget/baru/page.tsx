import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { ambilSettings } from '@/lib/pengaturan';
import { KATEGORI_BUDGET } from '@/db/schema';
import { parseRupiah } from '@/lib/money';
import type { KategoriBudget } from '@/lib/label';
import { FormItemBudget } from '../form-item';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Query param `nama`, `kategori`, dan `harga` diisi oleh tombol "Salin ke Budget"
 * di halaman vendor. Ini sekadar prefill sekali jalan — tidak ada tautan data
 * yang tersimpan antara vendor dan item budget.
 */
export default async function HalamanItemBaru({
  searchParams,
}: {
  searchParams: Promise<{ nama?: string; kategori?: string; harga?: string }>;
}) {
  const { nama, kategori, harga } = await searchParams;
  const settings = await ambilSettings();

  const kategoriValid = KATEGORI_BUDGET.includes(kategori as KategoriBudget)
    ? (kategori as KategoriBudget)
    : undefined;

  return (
    <>
      <TautanKembali href="/budget" label="Budget" />
      <KepalaHalaman judul="Item baru" />
      <FormItemBudget
        targetTamu={settings.targetTamu}
        namaAwal={nama}
        kategoriAwal={kategoriValid}
        hargaAwal={harga ? parseRupiah(harga) : undefined}
      />
      <div className="h-6" />
    </>
  );
}
