import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 sudah mengekspor flat config langsung, jadi FlatCompat
 * tidak dipakai — pembungkus itu gagal memvalidasi plugin React-nya.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'data/**', 'next-env.d.ts'] },
];

export default config;
