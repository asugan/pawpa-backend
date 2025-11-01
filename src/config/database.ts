import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../models/schema';

// Create database directory if it doesn't exist
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const dbPath = process.env.DATABASE_URL || './data/pawpa.db';
const dbDir = dirname(dbPath);

// Ensure data directory exists
mkdirSync(dbDir, { recursive: true });

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export database instance for raw queries if needed
export const sqliteDb: Database.Database = sqlite;

// Export schema for convenience
export * from '../models/schema';