import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for better performance
// fetchConnectionCache is now always true by default

// Lazy database connection to prevent build-time initialization
let _db: ReturnType<typeof drizzle> | null = null;

export const db = () => {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Validate DATABASE_URL format
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl.startsWith('postgresql://')) {
      throw new Error(`Invalid DATABASE_URL format. Expected postgresql:// but got: ${dbUrl.substring(0, 20)}...`);
    }
    
    try {
      console.log('Initializing database connection...');
      const sql = neon(dbUrl);
      _db = drizzle(sql);
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
  const directSql = neon(process.env.DIRECT_URL!);
  return drizzle(directSql);
};