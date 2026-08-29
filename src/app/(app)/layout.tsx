import { redirect } from 'next/navigation';
import { sessionSaatIni } from '@/lib/auth';
import { ambilSettings, namaPasangan } from '@/lib/pengaturan';
import { hitungMundur } from '@/lib/timeline';
import { NavBawah } from '@/components/nav-bawah';
import { SidebarKiri } from '@/components/sidebar-kiri';

export const runtime = 'nodejs';

/**
 * Dua kerangka dalam satu layout.
 *
 * Ponsel: satu kolom sempit, bottom nav melayang.
 * Desktop (`md` ke atas): sidebar tetap selebar 64 (16rem) di kiri, konten
 * mengambil sisanya. `md:pl-64` di main mengimbangi sidebar yang `fixed` —
 * sidebar sengaja fixed, bukan sticky, supaya menu tidak ikut bergulir pada
 * halaman panjang seperti Checklist.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const session = await sessionSaatIni();
  if (!session?.user) redirect('/login');

  const settings = await ambilSettings();

  return (
    <div className="min-h-dvh">
      <SidebarKiri
        namaPasangan={namaPasangan(settings)}
        sisaHari={hitungMundur(settings.tanggalResepsi)}
        tanggalResepsi={settings.tanggalResepsi}
      />

      <main className="ruang-nav md:pl-64">
        <div className="mx-auto max-w-lg md:max-w-5xl xl:max-w-7xl">{children}</div>
      </main>

      <NavBawah />
    </div>
  );
}
