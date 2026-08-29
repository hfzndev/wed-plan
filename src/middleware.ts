import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Semua halaman tertutup kecuali /login dan aset statis.
 *
 * /api/cron dikecualikan karena cron sistem tidak punya cookie sesi — route itu
 * menjaga dirinya sendiri dengan CRON_SECRET.
 *
 * Ini hanya menjaga navigasi halaman. Server action bisa dipanggil langsung
 * lewat HTTP, jadi masing-masing tetap memverifikasi sesi sendiri lewat
 * `wajibLogin()`.
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!login|api/auth|api/cron|manifest.webmanifest|_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|icon-maskable.png).*)',
  ],
};
