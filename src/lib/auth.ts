import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

export type Peran = 'pria' | 'wanita';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // App ini dibuka dari HP berdua. Login ulang tiap minggu hanya bikin jengkel,
    // dan tidak ada data pihak ketiga di sini.
    maxAge: 60 * 60 * 24 * 90,
  },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
          // Bandingkan tetap dijalankan supaya waktu respons tidak membocorkan
          // apakah email-nya terdaftar.
          await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
          return null;
        }

        const cocok = await bcrypt.compare(password, user.passwordHash);
        if (!cocok) return null;

        return { id: String(user.id), email: user.email, name: user.nama, peran: user.peran };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.peran = (user as { peran: Peran }).peran;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.peran = (token.peran as Peran) ?? 'berdua';
      }
      return session;
    },
  },
};

/** Session di server component / server action. Null kalau belum login. */
export function sessionSaatIni() {
  return getServerSession(authOptions);
}

/**
 * Dipakai di setiap server action. Middleware sudah memblokir halaman, tapi
 * server action bisa dipanggil langsung lewat HTTP — jadi tetap harus dicek.
 */
export async function wajibLogin() {
  const session = await sessionSaatIni();
  if (!session?.user) throw new Error('Tidak diizinkan');
  return session.user;
}
