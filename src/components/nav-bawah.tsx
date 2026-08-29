'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { MoreHorizontal, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TAB_BAWAH, DI_SHEET, sedangAktif } from './nav-item';

/**
 * Navigasi ponsel. Disembunyikan mulai `md`, di mana `SidebarKiri` yang bertugas
 * dan seluruh halaman muat tanpa perlu sheet "Lainnya".
 */
export function NavBawah() {
  const pathname = usePathname();
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const diLainnya = DI_SHEET.some((m) => pathname.startsWith(m.href));

  return (
    <div className="md:hidden">
      {sheetTerbuka && (
        <div
          className="fixed inset-0 z-40 bg-tinta/25"
          onClick={() => setSheetTerbuka(false)}
          aria-hidden
        />
      )}

      {sheetTerbuka && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-garis bg-permukaan pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-label="Menu lainnya"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <p className="label-kecil">Lainnya</p>
            <button
              onClick={() => setSheetTerbuka(false)}
              className="p-1 text-tinta-lembut"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="px-2 pb-2">
            {DI_SHEET.map((m) => {
              const Ikon = m.icon;
              const aktif = pathname.startsWith(m.href);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setSheetTerbuka(false)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg px-3 py-3',
                    aktif ? 'bg-terracotta-lembut' : 'active:bg-kertas',
                  )}
                >
                  <Ikon
                    className={cn('mt-0.5 size-5', aktif ? 'text-terracotta' : 'text-tinta-lembut')}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-tinta-samar">{m.ket}</span>
                  </span>
                </Link>
              );
            })}

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left active:bg-kertas"
            >
              <LogOut className="size-5 text-tinta-lembut" />
              <span className="text-sm font-medium">Keluar</span>
            </button>
          </nav>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-permukaan/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-lg items-end">
          {TAB_BAWAH.map((m) => {
            const Ikon = m.icon;
            const aktif = sedangAktif(pathname, m.href);

            if (m.fab) {
              return (
                <li key={m.href} className="flex-1">
                  <Link
                    href={m.href}
                    aria-current={aktif ? 'page' : undefined}
                    className="flex flex-col items-center gap-1 pt-1 pb-2 text-[11px]"
                  >
                    {/* Ring setebal 4px berwarna permukaan bikin lingkaran ini
                        tampak melubangi bar, bukan menempel di atasnya. */}
                    <span
                      aria-hidden
                      className={cn(
                        '-mt-7 flex size-14 items-center justify-center rounded-full shadow-[0_0_0_4px_var(--color-permukaan),0_6px_16px_rgba(44,38,33,0.22)] transition-transform active:scale-95',
                        aktif ? 'scale-105 bg-terracotta text-white' : 'bg-tinta text-kertas',
                      )}
                    >
                      <Ikon className="size-6" strokeWidth={aktif ? 2.2 : 1.8} />
                    </span>
                    <span className={aktif ? 'text-terracotta' : 'text-tinta-samar'}>{m.label}</span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={m.href} className="flex-1">
                <Link
                  href={m.href}
                  aria-current={aktif ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-2.5 text-[11px]',
                    aktif ? 'text-terracotta' : 'text-tinta-samar',
                  )}
                >
                  {aktif && (
                    <span
                      aria-hidden
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-terracotta"
                    />
                  )}
                  <Ikon className="size-5" strokeWidth={aktif ? 2.2 : 1.7} />
                  {m.label}
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <button
              onClick={() => setSheetTerbuka((v) => !v)}
              className={cn(
                'relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px]',
                diLainnya || sheetTerbuka ? 'text-terracotta' : 'text-tinta-samar',
              )}
              aria-expanded={sheetTerbuka}
            >
              {diLainnya && (
                <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-terracotta" />
              )}
              <MoreHorizontal className="size-5" strokeWidth={diLainnya ? 2.2 : 1.7} />
              Lainnya
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
