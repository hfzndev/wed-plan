'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { settings, users } from '@/db/schema';
import { jalankanAksi, jalankanAksiSederhana, KesalahanPengguna, type HasilAksi } from '@/lib/aksi';
import { skemaAcara, skemaAnggaran } from '@/lib/validators';
import { wajibLogin } from '@/lib/auth';
import { normalisasiNomor, kirimWhatsApp, wahaSiap } from '@/lib/waha';
import { pesanTes } from '@/lib/pesan-reminder';
import { ambilSettings } from '@/lib/pengaturan';

/**
 * Settings adalah baris tunggal id=1. Tiap halaman pengaturan hanya menulis
 * kolomnya sendiri, jadi barisnya dipastikan ada dulu — kalau dua halaman
 * sama-sama memakai upsert dengan seluruh kolom, halaman yang disimpan
 * belakangan akan menimpa isian halaman lain dengan nilai default.
 */
async function pastikanBarisSettings() {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
}

async function tulisSettings(data: Partial<typeof settings.$inferInsert>) {
  await pastikanBarisSettings();
  await db
    .update(settings)
    .set({ ...data, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(settings.id, 1));

  // Tanggal, target tamu, dan budget memengaruhi hampir semua halaman.
  revalidatePath('/', 'layout');
}

export async function simpanAcara(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaAcara, formData, tulisSettings);
}

export async function simpanAnggaran(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaAnggaran, formData, tulisSettings);
}

const skemaPassword = z
  .object({
    passwordLama: z.string().min(1, 'Password lama wajib diisi'),
    passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
    konfirmasi: z.string(),
  })
  .refine((d) => d.passwordBaru === d.konfirmasi, {
    message: 'Konfirmasi tidak sama dengan password baru',
    path: ['konfirmasi'],
  });

export async function gantiPassword(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiSederhana(async () => {
    const user = await wajibLogin();
    const hasil = skemaPassword.safeParse(Object.fromEntries(formData));
    if (!hasil.success) throw new KesalahanPengguna(hasil.error.issues[0]?.message ?? 'Data tidak valid');

    const [baris] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(user.id)))
      .limit(1);
    if (!baris) throw new KesalahanPengguna('Akun tidak ditemukan');

    const cocok = await bcrypt.compare(hasil.data.passwordLama, baris.passwordHash);
    if (!cocok) throw new KesalahanPengguna('Password lama salah');

    await db
      .update(users)
      .set({ passwordHash: await bcrypt.hash(hasil.data.passwordBaru, 12) })
      .where(eq(users.id, baris.id));
  });
}

const skemaWhatsapp = z.object({
  nomorPria: z.string(),
  aktifPria: z.string().optional(),
  nomorWanita: z.string(),
  aktifWanita: z.string().optional(),
});

/**
 * Nomor disimpan dalam bentuk E.164 hasil normalisasi, bukan apa adanya —
 * `toChatId()` di waha.ts sengaja hanya menerima bentuk itu.
 */
export async function simpanWhatsapp(_prev: HasilAksi | null, formData: FormData) {
  return jalankanAksi(skemaWhatsapp, formData, async (data) => {
    const pasangan = [
      { peran: 'pria' as const, mentah: data.nomorPria, aktif: data.aktifPria === 'on' },
      { peran: 'wanita' as const, mentah: data.nomorWanita, aktif: data.aktifWanita === 'on' },
    ];

    for (const p of pasangan) {
      const kosong = p.mentah.trim() === '';
      const e164 = kosong ? '' : normalisasiNomor(p.mentah);
      if (e164 === null) {
        throw new KesalahanPengguna(
          `Nomor ${p.peran} tidak dikenali. Pakai format 08xx atau +62 8xx.`,
        );
      }
      await db
        .update(users)
        .set({ whatsapp: e164, waAktif: p.aktif })
        .where(eq(users.peran, p.peran));
    }

    revalidatePath('/pengaturan');
  });
}

/**
 * Mengirim satu pesan sungguhan ke nomor yang tersimpan. Hasilnya dikembalikan
 * apa adanya — beda dari reminder yang fire-and-forget, di sini justru
 * kegagalannya yang ingin dilihat.
 */
export async function kirimTesWhatsapp(peran: 'pria' | 'wanita'): Promise<HasilAksi> {
  return jalankanAksiSederhana(async () => {
    if (!wahaSiap()) {
      throw new KesalahanPengguna('WAHA belum dikonfigurasi. Isi WAHA_BASE_URL di .env.');
    }

    const [baris] = await db
      .select({ nama: users.nama, whatsapp: users.whatsapp })
      .from(users)
      .where(eq(users.peran, peran))
      .limit(1);

    const nomor = baris?.whatsapp.trim();
    if (!nomor) throw new KesalahanPengguna('Nomornya belum diisi dan disimpan.');

    // Nama yang dipakai adalah yang diedit di Pengaturan. `users.nama` hanya
    // nilai bawaan seed yang tidak pernah muncul di layar mana pun.
    const s = await ambilSettings();
    const nama = (peran === 'pria' ? s.namaPria : s.namaWanita).trim() || baris.nama;

    const hasil = await kirimWhatsApp(nomor, pesanTes(nama));
    if (!hasil.ok) {
      throw new KesalahanPengguna(
        hasil.error === 'timeout'
          ? 'WAHA tidak menjawab dalam 15 detik. Cek apakah sesinya masih hidup.'
          : `Gagal kirim: ${hasil.error}`,
      );
    }
  });
}
