/**
 * Transport WAHA (WhatsApp HTTP API).
 *
 * Klien tingkat rendah untuk WAHA yang berjalan sendiri di VPS. Tidak tahu
 * apa-apa soal pernikahan — terima nomor E.164 dan sebuah string, laporkan
 * apakah WhatsApp menerimanya. Isi pesannya dirakit satu lapis di atas ini,
 * di `pesan-reminder.ts`.
 *
 * Diadaptasi dari pola yang sudah terbukti di project Sensasi.
 *
 * Env (kosongkan WAHA_BASE_URL untuk mematikan WhatsApp sepenuhnya):
 *   WAHA_BASE_URL — misalnya http://127.0.0.1:3001
 *   WAHA_API_KEY  — nilai header X-Api-Key; kosong kalau WAHA jalan tanpa auth
 *   WAHA_SESSION  — nama sesi WAHA; default "wedplan"
 *
 * Teks BUKAN HTML. Format WhatsApp adalah *tebal*, _miring_, ~coret~, ```mono```.
 * Tidak ada langkah escaping di sini dan itu disengaja: WhatsApp tidak punya
 * markup yang bisa ditembus input pengguna, dan escaping justru membuat
 * pembacanya melihat "&amp;" di layar.
 */

export type WahaConfig = {
  baseUrl: string;
  apiKey: string | null;
  session: string;
};

export type HasilKirim = { ok: true } | { ok: false; error: string };

const SESI_DEFAULT = 'wedplan';

/**
 * Engine webjs menjalankan sesi browser sungguhan, jadi satu round-trip jauh
 * lebih lambat daripada HTTP API biasa. 15 detik cukup untuk sesi yang hangat,
 * dan cukup pendek supaya WAHA yang macet tidak menahan job cron bermenit-menit.
 */
const TIMEOUT_MS = 15_000;
const TIMEOUT_TYPING_MS = 5_000;

/**
 * Jeda "sedang mengetik" sebelum mengirim. Dibuat bisa ditulis ulang karena
 * jedanya tanpa syarat — setiap test yang memicu pengiriman akan menunggu
 * percuma tanpa ini. Produksi tidak pernah mengubahnya.
 */
export const wahaTiming = {
  typingMinMs: 1_500,
  typingMaxMs: 3_000,
};

/**
 * Setelan koneksi WAHA, atau null saat WhatsApp dimatikan.
 * `WAHA_BASE_URL` adalah saklarnya; API key memang opsional karena WAHA bisa
 * dijalankan tanpa auth di jaringan privat.
 */
export function getWahaConfig(): WahaConfig | null {
  const baseUrl = process.env.WAHA_BASE_URL?.trim();
  if (!baseUrl) return null;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    apiKey: process.env.WAHA_API_KEY?.trim() || null,
    session: process.env.WAHA_SESSION?.trim() || SESI_DEFAULT,
  };
}

export function wahaSiap(): boolean {
  return getWahaConfig() !== null;
}

/**
 * Mengubah nomor E.164 tersimpan jadi chat id yang diminta WAHA
 * (`628123456789@c.us` — kode negara, tanpa `+`, tanpa pemisah).
 *
 * Sengaja ketat: hanya menerima bentuk yang dihasilkan `normalisasiNomor()`.
 * Nomor yang tidak pernah lewat normaliser itu adalah bug di hulu, dan menebak
 * bentuknya di sini berisiko mengirim pesan ke orang asing.
 */
export function toChatId(e164: string): string | null {
  const rapi = e164.trim();
  if (!/^\+\d{8,15}$/.test(rapi)) return null;
  return `${rapi.slice(1)}@c.us`;
}

/**
 * Menormalkan nomor yang diketik manusia jadi E.164 Indonesia.
 * "08123456789", "8123456789", "+62 812-3456-789", "62812345678" → "+628123456789".
 * Mengembalikan null kalau tidak masuk akal sebagai nomor.
 */
export function normalisasiNomor(mentah: string): string | null {
  const digit = mentah.replace(/\D/g, '');
  if (!digit) return null;

  let nasional: string;
  if (digit.startsWith('62')) nasional = digit.slice(2);
  else if (digit.startsWith('0')) nasional = digit.slice(1);
  else nasional = digit;

  // Nomor seluler Indonesia diawali 8 dan panjangnya 9–12 digit setelah kode negara.
  if (!/^8\d{8,11}$/.test(nasional)) return null;
  return `+62${nasional}`;
}

function headerWaha(config: WahaConfig): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) h['X-Api-Key'] = config.apiKey;
  return h;
}

/**
 * Menampilkan indikator "sedang mengetik" di chat penerima.
 *
 * Murni kosmetik, dan tanda tangannya mengatakan begitu: mengembalikan void,
 * bukan HasilKirim. Tidak ada kegagalan di sini yang bisa ditindaklanjuti
 * pemanggil, dan indikator yang rusak tidak boleh disalahartikan sebagai pesan
 * yang gagal terkirim.
 */
async function mulaiMengetik(config: WahaConfig, chatId: string): Promise<void> {
  try {
    const res = await fetch(`${config.baseUrl}/api/startTyping`, {
      method: 'POST',
      headers: headerWaha(config),
      body: JSON.stringify({ session: config.session, chatId }),
      signal: AbortSignal.timeout(TIMEOUT_TYPING_MS),
    });
    if (!res.ok) console.debug(`[waha] startTyping ${res.status} untuk ${chatId}`);
  } catch (err) {
    console.debug('[waha] startTyping gagal:', err instanceof Error ? err.message : err);
  }
}

/** Jeda berbeda tiap panggilan, supaya irama kirim tidak jadi interval yang terdeteksi. */
function jedaAcakMs(): number {
  const { typingMinMs, typingMaxMs } = wahaTiming;
  if (typingMaxMs <= typingMinMs) return Math.max(typingMinMs, 0);
  return typingMinMs + Math.random() * (typingMaxMs - typingMinMs);
}

function tidur(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mengirim pesan teks. Tidak pernah melempar — kegagalan kembali sebagai
 * `{ ok: false, error }` supaya job cron bisa mencatat statusnya per penerima.
 */
export async function kirimWhatsApp(nomorE164: string, teks: string): Promise<HasilKirim> {
  const config = getWahaConfig();
  if (!config) return { ok: false, error: 'waha_belum_dikonfigurasi' };

  const chatId = toChatId(nomorE164);
  if (!chatId) return { ok: false, error: 'nomor_tidak_valid' };

  // Jeda mengarang sebelum tiap pesan. Nomor pengirim adalah akun WhatsApp
  // sungguhan, dan balasan instan beruntun itulah yang membuat sesi kena banned.
  // Ini sekaligus memberi jarak antar pesan dalam satu batch.
  await mulaiMengetik(config, chatId);
  await tidur(jedaAcakMs());

  try {
    const res = await fetch(`${config.baseUrl}/api/sendText`, {
      method: 'POST',
      headers: headerWaha(config),
      body: JSON.stringify({ session: config.session, chatId, text: teks }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[waha] sendText ${res.status} untuk ${chatId}: ${body.slice(0, 200)}`);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const pesan = err instanceof Error ? err.message : String(err);
    console.error(`[waha] sendText gagal untuk ${chatId}:`, pesan);
    return { ok: false, error: pesan.includes('timeout') ? 'timeout' : 'jaringan' };
  }
}
