import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../config/database';
import * as schema from '../models/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  /*
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
    },
  },
  */
  trustedOrigins: [
    process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    'https://appleid.apple.com',
    'pawpa://', // Mobile app deep link
    'exp://', // Expo Go development
    'http://localhost:8081', // Expo Metro bundler
  ],
  advanced: {
    // Allow null origin from mobile apps (React Native doesn't send Origin header)
    // This is safe because mobile apps can't have traditional CSRF attacks
    disableOriginCheck: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Export auth type for type inference
export type Auth = typeof auth;
