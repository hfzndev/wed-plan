import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { TautanKembali } from '@/components/tautan-kembali';
import { ambilSettings } from '@/lib/pengaturan';
import { wahaSiap } from '@/lib/waha';
import { FormWhatsapp, type NomorAwal } from '../form-whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HalamanWhatsapp() {
  const [settings, akun] = await Promise.all([
    ambilSettings(),
    db
      .select({
        peran: users.peran,
        nama: users.nama,
        whatsapp: users.whatsapp,
        waAktif: users.waAktif,
      })
      .from(users)
      .orderBy(asc(users.id)),
  ]);

  return (
    <>
      <TautanKembali href="/pengaturan" label="Pengaturan" />
      <KepalaHalaman
        judul="Reminder WhatsApp"
        ket="Digest harian jam 7.30 dan ringkasan tiap Minggu malam, dikirim ke dua nomor sekaligus."
      />
      <FormWhatsapp
        awal={
          akun.map((u) => ({
            ...u,
            // Nama yang dipakai adalah yang diedit di Pengaturan, bukan nilai
            // bawaan seed yang tidak pernah muncul di layar mana pun.
            nama: (u.peran === 'pria' ? settings.namaPria : settings.namaWanita).trim() || u.nama,
          })) as NomorAwal[]
        }
        wahaSiap={wahaSiap()}
      />
      <div className="h-8" />
    </>
  );
}
