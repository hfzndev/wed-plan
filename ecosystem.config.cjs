// PM2 ecosystem untuk wed-plan (Next.js 16 standalone)
// Load .env produksi → start standalone server.js di port 3010
require('dotenv').config({ path: '/home/hfzndev/wed-plan/.env' });

module.exports = {
  apps: [
    {
      name: 'wed-plan',
      script: '/home/hfzndev/wed-plan/.next/standalone/server.js',
      cwd: '/home/hfzndev/wed-plan/.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      max_memory_restart: '500M',
      time: true,
      autorestart: true,
    },
  ],
};
