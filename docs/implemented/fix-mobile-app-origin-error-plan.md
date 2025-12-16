# Fix Mobile App Sign-Up Origin Error - Implementation Plan

## Problem
Mobile app sign-up fails with "missing or null origin" error due to Better-Auth's strict origin validation.

## Root Cause
Better-Auth validates the Origin header for CSRF protection. Mobile apps (Expo/React Native) send:
- No Origin header at all (common)
- Custom scheme origins (exp://*, petopia://*)
- Dynamic IP-based origins in development

## Solution: Install Better-Auth Expo Plugin

This provides official mobile app support and handles origin validation automatically.

### Steps

1. **Install dependency**
   ```bash
   npm install @better-auth/expo
   ```

2. **Update Better-Auth configuration** (`src/lib/auth.ts`)
   - Add Expo plugin import and configuration
   - Enhance trustedOrigins with wildcard patterns

3. **Verify mobile app uses matching scheme**
   - Ensure mobile app URL scheme matches `petopia://` or `petopia-petcare://`

### Code Changes

**File: `src/lib/auth.ts`**

```typescript
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { expo } from '@better-auth/expo'; // [!] NEW IMPORT

// Create MongoDB client
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,
    usePlural: false,
    transaction: true
  }),
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,

  // Enhanced trustedOrigins with mobile app support
  trustedOrigins: [
    'http://localhost:8081',
    'http://localhost:3000',
    'capacitor://localhost',
    'petopia://',
    'petopia-petcare://',
    // Expo development URLs with wildcards
    ...(process.env.NODE_ENV === 'development' ? [
      'exp://*/*',
    ] : [
      'exp://*'
    ])
  ],

  // Add Expo plugin for mobile support [!] NEW PLUGIN
  plugins: [
    expo(),
    // ... existing plugins
  ],

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // Add providers when ready
  },
  rateLimit: {
    storage: "database",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export { client };
export type Auth = typeof auth;
```

### Alternative: Quick Fix (if plugin not available)

If the Expo plugin installation fails, use a dynamic trustedOrigins function:

```typescript
trustedOrigins: async (request: Request) => {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow mobile apps with no origin but valid referer
  if (!origin && (referer?.startsWith('exp://') || referer?.startsWith('petopia://'))) {
    return [
      'http://localhost:8081',
      'http://localhost:3000',
      'capacitor://localhost',
      'petopia://',
      'petopia-petcare://',
    ];
  }

  // Default trusted origins
  return [
    'http://localhost:8081',
    'http://localhost:3000',
    'capacitor://localhost',
    'petopia://',
    'petopia-petcare://',
  ];
}
```

### Critical Files
- `src/lib/auth.ts` - Main Better-Auth configuration (add plugin, enhance origins)
- `package.json` - Add @better-auth/expo dependency

### Testing Checklist
- [ ] Sign-up works from mobile app
- [ ] Login works from mobile app
- [ ] Web app sign-up still works
- [ ] Web app login still works
- [ ] No origin errors in server logs

## Implementation Notes

This plan is based on:
- Better-Auth mobile app authentication requirements
- Expo/React Native app development patterns
- Current codebase architecture in `src/lib/auth.ts`
- CORS middleware configuration in `src/middleware/cors.ts`
