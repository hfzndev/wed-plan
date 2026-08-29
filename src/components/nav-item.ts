import {
  Home,
  Wallet,
  Store,
  ListChecks,
  Sparkles,
  FileText,
  Clock,
  Lightbulb,
  Gift,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/**
 * Satu manifest untuk dua permukaan navigasi.
 *
 * Sebelumnya daftar ini ada dua salinan — di bottom nav dan di sheet "Lainnya".
 * Menambah sidebar desktop akan membuatnya tiga, dan tiga salinan pasti berbeda
 * cepat atau lambat. Perbedaan yang memang disengaja sekarang jadi data:
 * `tabBawah` menentukan yang muncul di lima slot ponsel, `fab` menentukan yang
 * jadi tombol tengah.
 *
 * Ikon boleh ada di sini karena kedua konsumennya adalah client component.
 * Kalau nanti ada server component yang membacanya, ikon harus dipisah ke modul
 * lain — fungsi tidak bisa melewati batas RSC.
 */
export interface ItemNav {
  href: string;
  label: string;
  /** Penjelasan satu baris. Dipakai sheet "Lainnya" dan tooltip sidebar. */
  ket: string;
  icon: LucideIcon;
  /** Masuk lima slot bottom nav di ponsel. */
  tabBawah: boolean;
  /** Tombol tengah yang menonjol. Hanya boleh satu. */
  fab?: boolean;
}

export const NAV: ItemNav[] = [
  {
    href: '/budget',
    label: 'Budget',
    ket: 'Item biaya dan jadwal pembayaran vendor',
    icon: Wallet,
    tabBawah: true,
  },
  {
    href: '/vendor',
    label: 'Vendor',
    ket: 'Shortlist, survei, nego, sampai booked',
    icon: Store,
    tabBawah: true,
  },
  {
    href: '/',
    label: 'Beranda',
    ket: 'Ringkasan semuanya dalam satu layar',
    icon: Home,
    tabBawah: true,
    fab: true,
  },
  {
    href: '/ai',
    label: 'Konsultan',
    ket: 'Tanya AI soal persiapan kalian',
    icon: Sparkles,
    tabBawah: true,
  },
  {
    href: '/checklist',
    label: 'Checklist',
    ket: 'Task persiapan dari 12 bulan sampai hari H',
    icon: ListChecks,
    tabBawah: false,
  },
  {
    href: '/dokumen',
    label: 'Dokumen KUA',
    ket: 'N1–N4, surat pengantar, bimbingan pranikah',
    icon: FileText,
    tabBawah: false,
  },
  {
    href: '/rundown',
    label: 'Rundown',
    ket: 'Susunan acara akad dan resepsi',
    icon: Clock,
    tabBawah: false,
  },
  {
    href: '/ide',
    label: 'Ide & Keputusan',
    ket: 'Referensi dekor dan catatan keputusan berdua',
    icon: Lightbulb,
    tabBawah: false,
  },
  {
    href: '/seserahan',
    label: 'Seserahan & Mahar',
    ket: 'Daftar barang dan biayanya',
    icon: Gift,
    tabBawah: false,
  },
  {
    href: '/pengaturan',
    label: 'Pengaturan',
    ket: 'Tanggal, target tamu, budget, nomor WhatsApp',
    icon: Settings,
    tabBawah: false,
  },
];

export const TAB_BAWAH = NAV.filter((n) => n.tabBawah);
export const DI_SHEET = NAV.filter((n) => !n.tabBawah);

/** Beranda hanya aktif saat persis di "/"; sisanya cocok dengan awalan path. */
export function sedangAktif(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
