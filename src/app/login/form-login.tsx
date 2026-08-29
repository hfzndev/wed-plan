'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export function FormLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [memuat, setMemuat] = useState(false);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMemuat(true);

    const data = new FormData(e.currentTarget);
    const hasil = await signIn('credentials', {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      redirect: false,
    });

    if (hasil?.ok) {
      router.replace('/');
      router.refresh();
      return;
    }

    // Pesannya sengaja tidak menyebut mana yang salah.
    setError('Email atau password tidak cocok.');
    setMemuat(false);
  }

  return (
    <form onSubmit={kirim} className="mt-8">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" error={error}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={memuat}>
        {memuat ? 'Sebentar…' : 'Masuk'}
      </Button>
    </form>
  );
}
