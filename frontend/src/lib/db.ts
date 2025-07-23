import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_CONFIG } from './db-config';

// IMPORTANT: Hard-coded database connection strings
// These will always be used regardless of environment variables
const DB_URL = "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const DIRECT_DB_URL = "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Lazy database connection to prevent build-time initialization
let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof neon> | null = null;

export const db = () => {
  if (!_db) {
    try {
      console.log('Initializing database connection with hard-coded URL...');
      // Always use the hard-coded URL
      _sql = neon(DB_URL);
      _db = drizzle(_sql);
      console.log('Database connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return _db;
};

// For operations that need a direct connection (migrations, etc.)
export const getDirectDb = () => {
  try {
    // Always use the hard-coded direct URL
    const directSql = neon(DIRECT_DB_URL);
    return drizzle(directSql);
  } catch (error) {
    console.error('Failed to initialize direct database connection:', error);
    throw new Error(`Direct database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};