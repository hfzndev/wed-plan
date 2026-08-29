import Link from 'next/link';
import { asc } from 'drizzle-orm';
import {
  Heart,
  Wallet,
  MessageCircle,
  KeyRound,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { db } from '@/db';
import { users } from '@/db/schema';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { ambilSettings } from '@/lib/pengaturan';
import { wahaSiap } from '@/lib/waha';
import { rupiahRingkas, angka } from '@/lib/money';
import { tanggalPendek } from '@/lib/timeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daftar pengaturan, bukan satu form panjang.
 *
 * Tiap baris menampilkan nilai yang sedang berlaku, jadi memeriksa "tanggalnya
 * sudah benar belum" tidak perlu membuka halamannya dulu — itu yang membuat
 * daftar ini berguna, bukan sekadar satu ketukan tambahan.
 */
export default async function HalamanPengaturan() {
  const [settings, akun] = await Promise.all([
    ambilSettings(),
    db
      .select({ peran: users.peran, whatsapp: users.whatsapp, waAktif: users.waAktif })
      .from(users)
      .orderBy(asc(users.id)),
  ]);

  const nama = [settings.namaPria, settings.namaWanita].filter(Boolean).join(' & ');
  const nomorAktif = akun.filter((u) => u.waAktif && u.whatsapp.trim()).length;

  const menu = [
    {
      href: '/pengaturan/acara',
      label: 'Mempelai & acara',
      icon: Heart,
      ket: 'Nama, tanggal, dan venue akad serta resepsi',
      nilai: ringkasAcara(nama, settings.tanggalResepsi),
      perluDiisi: !settings.tanggalResepsi,
    },
    {
      href: '/pengaturan/anggaran',
      label: 'Anggaran & tamu',
      icon: Wallet,
      ket: 'Target jumlah tamu dan total budget',
      nilai:
        settings.targetTamu > 0 || settings.totalBudget > 0
          ? [
              settings.targetTamu > 0 ? `${angka(settings.targetTamu)} tamu` : null,
              settings.totalBudget > 0 ? rupiahRingkas(settings.totalBudget) : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : 'Belum diisi',
      perluDiisi: settings.targetTamu === 0 || settings.totalBudget === 0,
    },
    {
      href: '/pengaturan/whatsapp',
      label: 'Reminder WhatsApp',
      icon: MessageCircle,
      ket: 'Nomor tujuan digest harian dan ringkasan mingguan',
      nilai: !wahaSiap()
        ? 'WAHA belum dikonfigurasi'
        : nomorAktif === 0
          ? 'Nomor belum diisi'
          : `${nomorAktif} nomor aktif`,
      perluDiisi: !wahaSiap() || nomorAktif === 0,
    },
    {
      href: '/pengaturan/keamanan',
      label: 'Keamanan',
      icon: KeyRound,
      ket: 'Ganti password akunmu sendiri',
      nilai: 'Ganti password',
      perluDiisi: false,
    },
  ] satisfies BarisMenu[];

  return (
    <>
      <KepalaHalaman judul="Pengaturan" />

      <ul className="mx-5 mb-8 md:max-w-2xl">
        {menu.map((m) => (
          <Baris key={m.href} {...m} />
        ))}
      </ul>
    </>
  );
}

interface BarisMenu {
  href: string;
  label: string;
  icon: LucideIcon;
  ket: string;
  nilai: string;
  perluDiisi: boolean;
}

function Baris({ href, label, icon: Ikon, ket, nilai, perluDiisi }: BarisMenu) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3.5 border-b border-garis py-4 first:border-t md:transition-colors md:hover:bg-permukaan"
      >
        <Ikon className="size-5 shrink-0 text-tinta-lembut" strokeWidth={1.7} />

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>

          {/* Di ponsel nilainya yang ditampilkan di bawah label; penjelasan
              panjang membuat baris membungkus tiga kali dan berebut ruang
              dengan nilai di kanan. Penjelasan baru muncul saat ada tempatnya. */}
          <span className={`block text-xs md:hidden ${warnaNilai(perluDiisi)}`}>{nilai}</span>
          <span className="hidden text-xs text-tinta-samar md:block">{ket}</span>
        </span>

        <span className={`hidden shrink-0 text-right text-xs md:block ${warnaNilai(perluDiisi)}`}>
          {nilai}
        </span>
        <ChevronRight className="size-4 shrink-0 text-tinta-samar" />
      </Link>
    </li>
  );
}

function warnaNilai(perluDiisi: boolean): string {
  return perluDiisi ? 'text-terracotta' : 'text-tinta-lembut';
}

function ringkasAcara(nama: string, tanggalResepsi: string | null): string {
  if (!nama && !tanggalResepsi) return 'Belum diisi';
  if (!tanggalResepsi) return 'Tanggal belum diisi';
  return tanggalPendek(tanggalResepsi);
}
