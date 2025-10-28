import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/pawpa.db',
  },
  strict: true,
} satisfies Config;