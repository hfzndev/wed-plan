import { asc } from 'drizzle-orm';
import { Sparkles } from 'lucide-react';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { sessionSaatIni } from '@/lib/auth';
import { aiSiap } from '@/lib/ai';
import { KepalaHalaman } from '@/components/kepala-halaman';
import { ChatAi } from './chat-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Riwayat yang ditampilkan. Utas panjang tidak perlu dirender seluruhnya. */
const MAKS_TAMPIL = 60;

export default async function HalamanAi() {
  const session = await sessionSaatIni();

  if (!aiSiap()) {
    return (
      <>
        <KepalaHalaman eyebrow="Konsultan" judul="AI belum dikonfigurasi" />
        <div className="kartu mx-5 px-5 py-6 md:max-w-2xl">
          <Sparkles className="size-6 text-tinta-samar" />
          <p className="mt-3 text-sm text-tinta-lembut">
            Isi tiga baris ini di <code className="text-tinta">.env</code>, lalu jalankan ulang
            server:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-garis bg-kertas p-3 text-xs">
            {`AI_BASE_URL=https://ai.sumopod.com/v1
AI_API_KEY=sk-...
AI_MODEL=deepseek-chat`}
          </pre>
          <p className="mt-3 text-xs text-tinta-samar">
            Provider mana pun yang bicara protokol OpenAI bisa dipakai. Untuk DeepSeek langsung,
            ganti <code>AI_BASE_URL</code> jadi <code>https://api.deepseek.com</code>.
          </p>
        </div>
      </>
    );
  }

  const riwayat = await db
    .select()
    .from(chatMessages)
    .orderBy(asc(chatMessages.id))
    .limit(MAKS_TAMPIL);

  return (
    <>
      <KepalaHalaman
        eyebrow="Konsultan"
        judul="Tanya apa saja"
        ket="Menjawab berdasarkan data pernikahan kalian, bukan nasihat umum."
      />
      <ChatAi riwayatAwal={riwayat} namaSaya={session?.user?.name ?? ''} />
    </>
  );
}
