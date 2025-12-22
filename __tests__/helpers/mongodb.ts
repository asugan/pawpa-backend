import { beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';

export const setupTestDB = () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MONGODB_TEST_URI or MONGODB_URI environment variable is required for tests'
      );
    }
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        // Ignore errors for capped collections
        const err = error as { message?: string };
        if (!err.message?.includes('not a capped collection')) {
          throw error;
        }
      }
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};
