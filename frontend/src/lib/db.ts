import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for better performance
// fetchConnectionCache is now always true by default

// Lazy database connection to prevent build-time initialization
let _db: ReturnType<typeof drizzle> | null = null;

export const db = () => {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql);
  }
  return _db;
};

// For operations that need a direct connection (migrations, etc.)
export const getDirectDb = () => {
  const directSql = neon(process.env.DIRECT_URL!);
  return drizzle(directSql);
};