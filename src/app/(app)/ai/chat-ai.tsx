'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { PROMPT_ANALISA } from '@/lib/konteks-wedding';

interface Gelembung {
  id: string;
  peran: 'user' | 'asisten';
  oleh: 'pria' | 'wanita' | null;
  isi: string;
}

export function ChatAi({
  riwayatAwal,
  namaSaya,
}: {
  riwayatAwal: ChatMessage[];
  namaSaya: string;
}) {
  const router = useRouter();
  const [pesan, setPesan] = useState<Gelembung[]>(() =>
    riwayatAwal.map((m) => ({ id: String(m.id), peran: m.peran, oleh: m.oleh, isi: m.isi })),
  );
  const [input, setInput] = useState('');
  const [mengalir, setMengalir] = useState(false);
  const bawahRef = useRef<HTMLDivElement>(null);

  // Menggulung ke bawah tiap ada teks baru. Ini sinkronisasi ke DOM, bukan
  // setState — memang tempatnya di effect.
  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [pesan]);

  async function kirim(teks: string) {
    if (!teks.trim() || mengalir) return;

    const idSaya = `u-${Date.now()}`;
    const idAi = `a-${Date.now()}`;
    setPesan((p) => [
      ...p,
      { id: idSaya, peran: 'user', oleh: null, isi: teks },
      { id: idAi, peran: 'asisten', oleh: null, isi: '' },
    ]);
    setInput('');
    setMengalir(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: teks }),
      });

      if (!res.ok || !res.body) {
        const pesanError = (await res.text()) || 'Gagal menghubungi AI.';
        tulisKe(idAi, pesanError);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let isi = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        isi += decoder.decode(value, { stream: true });
        tulisKe(idAi, isi);
      }
    } catch {
      tulisKe(idAi, 'Koneksi terputus sebelum jawaban selesai.');
    } finally {
      setMengalir(false);
      // Menyegarkan supaya id dari database menggantikan id sementara.
      router.refresh();
    }
  }

  function tulisKe(id: string, isi: string) {
    setPesan((p) => p.map((m) => (m.id === id ? { ...m, isi } : m)));
  }

  async function hapusRiwayat() {
    if (!confirm('Hapus seluruh riwayat percakapan?')) return;
    await fetch('/api/ai/chat', { method: 'DELETE' });
    setPesan([]);
    router.refresh();
  }

  const kosong = pesan.length === 0;

  return (
    <div className="flex min-h-[60vh] flex-col md:mx-auto md:min-h-[calc(100dvh-13rem)] md:max-w-3xl">
      <div className="flex-1 space-y-3 px-5">
        {kosong && (
          <div className="kartu px-5 py-6">
            <Sparkles className="size-6 text-terracotta" />
            <p className="mt-3 font-medium">Konsultan pernikahan kalian</p>
            <p className="mt-1 text-sm text-tinta-lembut">
              Dia membaca seluruh data di aplikasi ini — budget, vendor, checklist, dokumen,
              seserahan — lalu menjawab dengan angka kalian sendiri, bukan nasihat umum.
            </p>
            <p className="mt-3 text-xs text-tinta-samar">
              Coba tanya: &ldquo;Berapa persen budget kami sudah terpakai?&rdquo; atau &ldquo;Apa
              yang paling mendesak bulan ini?&rdquo;
            </p>
          </div>
        )}

        {pesan.map((m) => (
          <div
            key={m.id}
            className={cn('flex', m.peran === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed md:max-w-[75%]',
                m.peran === 'user'
                  ? 'bg-terracotta text-white'
                  : 'kartu whitespace-pre-wrap',
              )}
            >
              {m.peran === 'asisten' && m.isi === '' ? (
                <span className="text-tinta-samar">Sedang membaca data kalian…</span>
              ) : (
                m.isi
              )}
            </div>
          </div>
        ))}
        <div ref={bawahRef} />
      </div>

      <div className="sticky bottom-0 mt-4 border-t border-garis bg-kertas/95 px-5 pt-3 pb-2 backdrop-blur md:pb-4">
        {kosong && (
          <Button
            variant="garis"
            className="mb-2 w-full"
            disabled={mengalir}
            onClick={() => kirim(PROMPT_ANALISA)}
          >
            <Sparkles /> Analisa persiapan kami
          </Button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            kirim(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mengalir ? 'Menunggu jawaban…' : 'Tanya apa saja soal persiapan kalian'}
            disabled={mengalir}
            maxLength={2000}
            className="h-11 flex-1 rounded-md border border-garis-kuat bg-permukaan px-3 text-tinta placeholder:text-tinta-samar disabled:opacity-60"
          />
          <Button type="submit" size="ikon" disabled={mengalir || !input.trim()} aria-label="Kirim">
            <Send />
          </Button>
        </form>

        {!kosong && (
          <button
            type="button"
            onClick={hapusRiwayat}
            disabled={mengalir}
            className="mt-2 flex items-center gap-1.5 text-xs text-tinta-samar disabled:opacity-40"
          >
            <Trash2 className="size-3.5" /> Hapus riwayat
          </button>
        )}

        <p className="mt-2 text-[11px] text-tinta-samar">
          {namaSaya} · Konsultan hanya membaca, tidak bisa mengubah data kalian.
        </p>
      </div>
    </div>
  );
}
