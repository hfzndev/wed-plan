'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV, sedangAktif } from './nav-item';

/**
 * Navigasi desktop. Tersembunyi di bawah `md`, di mana bottom nav yang bertugas.
 *
 * Seluruh sepuluh halaman terlihat sekaligus — sheet "Lainnya" ada karena ponsel
 * cuma punya lima slot, bukan karena enam halaman itu memang kurang penting.
 * Di layar lebar batasan itu tidak berlaku, jadi tidak perlu disembunyikan.
 */
export function SidebarKiri({
  namaPasangan,
  sisaHari,
  tanggalResepsi,
}: {
  namaPasangan: string;
  sisaHari: number | null;
  tanggalResepsi: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-garis bg-permukaan md:flex">
      <div className="border-b border-garis px-5 py-5">
        <p className="label-kecil">Rencana Kita</p>
        <p className="mt-1 font-serif text-lg leading-tight">{namaPasangan}</p>

        {tanggalResepsi && sisaHari !== null && (
          <p className="angka mt-2 text-sm text-tinta-lembut">
            {sisaHari >= 0 ? (
              <>
                <span className="text-terracotta">{sisaHari}</span> hari menuju resepsi
              </>
            ) : (
              <>Resepsi sudah lewat {Math.abs(sisaHari)} hari</>
            )}
          </p>
        )}
        {!tanggalResepsi && (
          <Link href="/pengaturan" className="mt-2 block text-sm text-terracotta underline">
            Tentukan tanggal
          </Link>
        )}
      </div>

      <nav aria-label="Navigasi samping" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {NAV.map((m) => {
            const Ikon = m.icon;
            const aktif = sedangAktif(pathname, m.href);
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  aria-current={aktif ? 'page' : undefined}
                  title={m.ket}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    aktif
                      ? 'bg-terracotta-lembut font-medium text-terracotta'
                      : 'text-tinta-lembut hover:bg-kertas hover:text-tinta',
                  )}
                >
                  <Ikon className="size-4.5 shrink-0" strokeWidth={aktif ? 2.2 : 1.7} />
                  {m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-garis p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-tinta-lembut transition-colors hover:bg-kertas hover:text-tinta"
        >
          <LogOut className="size-4.5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
