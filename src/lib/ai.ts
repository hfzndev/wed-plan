import 'server-only';
import OpenAI from 'openai';

/**
 * Klien AI yang netral terhadap provider.
 *
 * SumoPod dan DeepSeek dua-duanya bicara protokol OpenAI, jadi pindah provider
 * cukup mengganti env — tidak ada kode di sini yang berubah. Paket `openai`
 * dipakai murni sebagai transport HTTP + parser SSE, bukan karena OpenAI-nya.
 *
 * Env dibaca saat dipanggil, bukan saat modul dimuat — pola yang sama dengan
 * `waha.ts`. `AI_API_KEY` kosong berarti fitur mati, bukan error.
 *
 *   AI_BASE_URL — default https://ai.sumopod.com/v1
 *   AI_API_KEY  — kunci provider; kosong = AI dimatikan
 *   AI_MODEL    — default deepseek-chat
 */

const BASE_URL_DEFAULT = 'https://ai.sumopod.com/v1';
const MODEL_DEFAULT = 'deepseek-chat';

/** Cukup panjang untuk analisa menyeluruh, cukup pendek supaya biayanya terduga. */
const MAKS_TOKEN_JAWABAN = 1_500;

/**
 * Riwayat yang ikut dikirim tiap panggilan. Percakapan panjang tidak boleh
 * diam-diam menaikkan biaya di setiap giliran, jadi hanya N pesan terakhir
 * yang dibawa.
 */
export const MAKS_RIWAYAT = 16;

export interface KonfigAi {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function getAiConfig(): KonfigAi | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    baseUrl: process.env.AI_BASE_URL?.trim() || BASE_URL_DEFAULT,
    apiKey,
    model: process.env.AI_MODEL?.trim() || MODEL_DEFAULT,
  };
}

export function aiSiap(): boolean {
  return getAiConfig() !== null;
}

export type PeranPesan = 'user' | 'assistant';

export interface PesanChat {
  peran: PeranPesan;
  isi: string;
}

/** Dilempar saat AI gagal, dengan pesan yang memang layak dibaca pengguna. */
export class KesalahanAi extends Error {}

/**
 * Mengalirkan jawaban model sebagai potongan teks.
 *
 * Streaming, bukan sekali-jadi, karena analisa menyeluruh butuh belasan detik —
 * layar diam selama itu tidak bisa dibedakan dari aplikasi yang menggantung.
 *
 * Error jaringan diterjemahkan jadi kalimat berbahasa Indonesia. Stack trace
 * provider tidak berguna bagi orang yang sedang merencanakan pernikahan.
 */
export async function* alirkanJawaban(
  systemPrompt: string,
  riwayat: PesanChat[],
): AsyncGenerator<string> {
  const config = getAiConfig();
  if (!config) throw new KesalahanAi('AI belum dikonfigurasi.');

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    maxRetries: 1,
    timeout: 60_000,
  });

  const pesan = riwayat.slice(-MAKS_RIWAYAT).map((p) => ({
    role: p.peran,
    content: p.isi,
  }));

  let stream;
  try {
    stream = await client.chat.completions.create({
      model: config.model,
      max_tokens: MAKS_TOKEN_JAWABAN,
      temperature: 0.3,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...pesan],
    });
  } catch (err) {
    throw new KesalahanAi(terjemahkanError(err));
  }

  try {
    for await (const bagian of stream) {
      const teks = bagian.choices[0]?.delta?.content;
      if (teks) yield teks;
    }
  } catch (err) {
    // Putus di tengah aliran: yang sudah tampil di layar tetap dipertahankan,
    // pemanggil menambahkan catatan ini di ekornya.
    throw new KesalahanAi(terjemahkanError(err));
  }
}

function terjemahkanError(err: unknown): string {
  console.error('[ai]', err);

  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return 'API key ditolak provider. Periksa AI_API_KEY di .env.';
    if (err.status === 402) return 'Saldo provider habis atau limit terlampaui.';
    if (err.status === 404) {
      return `Model "${process.env.AI_MODEL?.trim() || MODEL_DEFAULT}" tidak ada di provider ini. Periksa AI_MODEL.`;
    }
    if (err.status === 429) return 'Provider sedang membatasi permintaan. Coba lagi sebentar lagi.';
    if (err.status && err.status >= 500) return 'Provider AI sedang bermasalah. Coba lagi nanti.';
    return `Provider menolak permintaan (${err.status ?? 'tanpa kode'}).`;
  }

  const pesan = err instanceof Error ? err.message : String(err);
  if (/timeout|aborted/i.test(pesan)) return 'Provider tidak menjawab dalam 60 detik.';
  return 'Gagal menghubungi provider AI. Periksa koneksi dan AI_BASE_URL.';
}
