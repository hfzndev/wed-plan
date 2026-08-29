import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { FormDokumen } from '../form-dokumen';
import { TombolHapusDokumen } from './tombol-hapus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanUbahDokumen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dokumenId = Number(id);
  if (!Number.isInteger(dokumenId) || dokumenId <= 0) notFound();

  const [dokumen] = await db.select().from(documents).where(eq(documents.id, dokumenId)).limit(1);
  if (!dokumen) notFound();

  return (
    <>
      <TautanKembali href="/dokumen" label="Dokumen" />
      <KepalaHalaman judul="Ubah dokumen" />
      <FormDokumen awal={dokumen} />
      <div className="mx-5 mt-4 mb-8">
        <TombolHapusDokumen id={dokumen.id} nama={dokumen.nama} />
      </div>
    </>
  );
}
