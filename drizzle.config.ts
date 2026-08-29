import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: `file:${process.env.DATABASE_PATH ?? './data/wedplan.db'}` },
} satisfies Config;
