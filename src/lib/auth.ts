import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { expo } from '@better-auth/expo';

// Create MongoDB client
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}
const client = new MongoClient(mongoUri);
const db = client.db(); // Uses database name from connection string

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('AUTH_SECRET is required');
}

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: mongodbAdapter(db, {
    client,
    usePlural: false,
    transaction: false, // Disable transactions for standalone MongoDB
  }),
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL,
  // Enhanced trustedOrigins with mobile app support
  trustedOrigins: [
    'http://localhost:8081',
    'http://localhost:3000',
    'capacitor://localhost',
    'petopia://',
    'petopia-petcare://',
    // Expo development URLs with wildcards
    ...(process.env.NODE_ENV === 'development' ? ['exp://*/*'] : ['exp://*']),
  ],
  emailAndPassword: {
    enabled: true,
  },

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

  // Add Expo plugin for mobile support
  plugins: [
    expo(),
    // Your existing plugins (apiKey, admin, etc.)
  ],
  rateLimit: {
    storage: 'database', // Uses MongoDB for rate limiting storage
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Make sure to export the client for reuse
export { client };

// Export auth type for type inference
export type Auth = typeof auth;
