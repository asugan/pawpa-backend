import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// Create MongoDB client
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db(); // Uses database name from connection string

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,        // Enables transactions
    usePlural: false,      // Use singular collection names
    transaction: true      // Enable MongoDB transactions
  }),
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:8081',
    'http://localhost:3000',
    'capacitor://localhost',
    'pawpa://',
    'exp://'
  ],
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
  socialProviders: {
    // Add providers when ready
  },
  plugins: [
    // Your existing plugins (apiKey, admin, etc.)
  ],
  rateLimit: {
    storage: "database", // Uses MongoDB for rate limiting storage
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
