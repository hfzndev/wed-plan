'use client';

import { useActionState, useState } from 'react';
import type { Settings } from '@/db/schema';
import { Field, Input } from '@/components/ui/field';
import { TombolSimpan, PesanAksi } from '@/components/ui/status-form';
import { angka, parseRupiah, rupiah } from '@/lib/money';
import type { HasilAksi } from '@/lib/validators';
import { simpanAnggaran } from './actions';

export function FormAnggaran({ awal }: { awal: Settings }) {
  const [hasil, aksi] = useActionState<HasilAksi | null, FormData>(simpanAnggaran, null);
  const [tamu, setTamu] = useState(awal.targetTamu ? String(awal.targetTamu) : '');
  const [budget, setBudget] = useState(awal.totalBudget ? angka(awal.totalBudget) : '');

  const jumlahTamu = parseRupiah(tamu);
  const totalBudget = parseRupiah(budget);
  // Katering lazimnya 40–60% total dan dihitung per orang. Menunjukkan
  // rentangnya di sini membuat konsekuensi mengubah target tamu langsung terasa,
  // bukan baru ketahuan saat menyusun item budget.
  const perPax =
    jumlahTamu > 0 && totalBudget > 0
      ? {
          bawah: Math.round((totalBudget * 0.4) / jumlahTamu),
          atas: Math.round((totalBudget * 0.6) / jumlahTamu),
        }
      : null;

  return (
    <form action={aksi} className="kartu mx-5 p-5 md:max-w-2xl">
      <Field
        label="Target jumlah tamu"
        hint="Dipakai menghitung item budget bertipe per orang, misalnya katering."
      >
        <Input
          name="targetTamu"
          inputMode="numeric"
          className="angka"
          value={tamu}
          onChange={(e) => setTamu(e.target.value)}
        />
      </Field>

      <Field label="Total budget (Rp)" hint="Sisakan 10–15% sebagai dana darurat.">
        <Input
          name="totalBudget"
          inputMode="numeric"
          className="angka"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </Field>

      {perPax && (
        <p className="-mt-1 mb-4 rounded-md border border-garis bg-kertas px-3 py-2 text-xs text-tinta-lembut">
          Dengan {angka(jumlahTamu)} tamu dan budget {rupiah(totalBudget)}, porsi katering yang
          wajar (40–60%) berarti sekitar{' '}
          <span className="angka text-tinta">
            {rupiah(perPax.bawah)}–{rupiah(perPax.atas)}
          </span>{' '}
          per orang.
        </p>
      )}

      <TombolSimpan className="w-full" size="lg" />
      <PesanAksi hasil={hasil} />
    </form>
  );
}
