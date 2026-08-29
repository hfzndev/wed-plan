export const runtime = 'nodejs';

/**
 * Manifest disajikan lewat route agar bisa dilewatkan middleware tanpa
 * dianggap halaman terproteksi — browser mengambilnya sebelum ada sesi.
 */
export function GET() {
  return Response.json({
    name: 'Rencana Kita',
    short_name: 'Rencana',
    description: 'Perencanaan pernikahan berdua',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf7f2',
    theme_color: '#faf7f2',
    lang: 'id',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
}
