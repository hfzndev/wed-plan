import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { MessageCircle, Camera, Globe, FileText, ArrowRightLeft } from 'lucide-react';
import { db } from '@/db';
import { vendors, vendorFiles } from '@/db/schema';
import { rupiah, angka } from '@/lib/money';
import { LABEL_KATEGORI, LABEL_STATUS_VENDOR } from '@/lib/label';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { TautanTombol } from '@/components/ui/button';
import { FormVendor } from '../form-vendor';
import { FormUnggah } from './form-unggah';
import { TombolHapusVendor, TombolHapusBerkas } from './tombol-hapus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "08123456789" dan "+62 812-3456-789" sama-sama jadi "62812345678 9" yang valid untuk wa.me. */
function nomorWa(mentah: string): string | null {
  const digit = mentah.replace(/\D/g, '');
  if (digit.length < 8) return null;
  if (digit.startsWith('62')) return digit;
  if (digit.startsWith('0')) return `62${digit.slice(1)}`;
  return digit;
}

export default async function HalamanVendor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendorId = Number(id);
  if (!Number.isInteger(vendorId) || vendorId <= 0) notFound();

  const [[vendor], berkas] = await Promise.all([
    db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1),
    db.select().from(vendorFiles).where(eq(vendorFiles.vendorId, vendorId)).orderBy(asc(vendorFiles.id)),
  ]);

  if (!vendor) notFound();

  const wa = vendor.whatsapp ? nomorWa(vendor.whatsapp) : null;
  const ig = vendor.instagram.replace(/^@/, '');

  const salinKeBudget = `/budget/baru?nama=${encodeURIComponent(vendor.nama)}&kategori=${vendor.kategori}&harga=${vendor.hargaPenawaran}`;

  return (
    <>
      <TautanKembali href="/vendor" label="Vendor" />
      <KepalaHalaman
        judul={vendor.nama}
        ket={`${LABEL_KATEGORI[vendor.kategori]} · ${LABEL_STATUS_VENDOR[vendor.status]}${vendor.lokasi ? ` · ${vendor.lokasi}` : ''}`}
      />

      {vendor.hargaPenawaran > 0 && (
        <section className="kartu mx-5 px-5 py-4">
          <p className="label-kecil">Harga penawaran</p>
          <p className="angka mt-1 text-2xl">{rupiah(vendor.hargaPenawaran)}</p>
          <TautanTombol href={salinKeBudget} variant="garis" size="sm" className="mt-3">
            <ArrowRightLeft /> Salin ke Budget
          </TautanTombol>
          <p className="mt-2 text-xs text-tinta-samar">
            Membuka form item budget dengan nama, kategori, dan harga sudah terisi. Setelah itu
            keduanya berdiri sendiri — mengubah harga di sini tidak mengubah item budget.
          </p>
        </section>
      )}

      {(wa || ig || vendor.website) && (
        <section className="mx-5 mt-4 flex gap-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="kartu flex flex-1 flex-col items-center gap-1 py-3 text-xs text-tinta-lembut"
            >
              <MessageCircle className="size-5 text-sage" />
              WhatsApp
            </a>
          )}
          {ig && (
            <a
              href={`https://instagram.com/${encodeURIComponent(ig)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="kartu flex flex-1 flex-col items-center gap-1 py-3 text-xs text-tinta-lembut"
            >
              <Camera className="size-5 text-terracotta" />
              Instagram
            </a>
          )}
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="kartu flex flex-1 flex-col items-center gap-1 py-3 text-xs text-tinta-lembut"
            >
              <Globe className="size-5 text-tinta-lembut" />
              Website
            </a>
          )}
        </section>
      )}

      {vendor.catatan && (
        <section className="kartu mx-5 mt-4 px-5 py-4">
          <p className="label-kecil">Catatan</p>
          <p className="mt-1.5 text-sm whitespace-pre-wrap">{vendor.catatan}</p>
        </section>
      )}

      <section className="kartu mx-5 mt-4 px-5 py-4">
        <p className="label-kecil">Kontrak & quotation</p>
        {berkas.length === 0 ? (
          <p className="mt-1.5 text-sm text-tinta-lembut">Belum ada berkas.</p>
        ) : (
          <ul className="mt-2 divide-y divide-garis">
            {berkas.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/api/files/${b.id}`}
                  target="_blank"
                  className="flex min-w-0 items-center gap-2"
                >
                  <FileText className="size-4 shrink-0 text-tinta-samar" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{b.namaAsli}</span>
                    <span className="block text-xs text-tinta-samar">
                      {angka(Math.round(b.size / 1024))} KB
                    </span>
                  </span>
                </Link>
                <TombolHapusBerkas id={b.id} nama={b.namaAsli} />
              </li>
            ))}
          </ul>
        )}
        <FormUnggah vendorId={vendor.id} />
      </section>

      <h2 className="mx-5 mt-7 mb-3 text-lg">Ubah vendor</h2>
      <FormVendor awal={vendor} />

      <div className="mx-5 mt-4 mb-8">
        <TombolHapusVendor id={vendor.id} nama={vendor.nama} />
      </div>
    </>
  );
}
