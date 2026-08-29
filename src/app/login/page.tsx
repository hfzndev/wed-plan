import { redirect } from 'next/navigation';
import { sessionSaatIni } from '@/lib/auth';
import { FormLogin } from './form-login';

export const runtime = 'nodejs';

export default async function HalamanLogin() {
  const session = await sessionSaatIni();
  if (session?.user) redirect('/');

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 pb-24">
      <div className="mx-auto w-full max-w-sm">
        <p className="label-kecil">Rencana Kita</p>
        <h1 className="mt-2 text-3xl">Selamat datang kembali</h1>
        <p className="mt-2 text-sm text-tinta-lembut">
          Halaman ini hanya untuk kalian berdua.
        </p>
        <FormLogin />
      </div>
    </main>
  );
}
