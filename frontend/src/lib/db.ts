import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_CONFIG } from './db-config';

// Configure Neon for better performance
// fetchConnectionCache is now always true by default

// Lazy database connection to prevent build-time initialization
let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof neon> | null = null;

export const db = () => {
  if (!_db) {
    // Get database URL from environment
    const dbUrl = DATABASE_CONFIG.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Validate DATABASE_URL format
    if (!dbUrl.startsWith('postgresql://')) {
      throw new Error(`Invalid DATABASE_URL format. Expected postgresql:// but got: ${dbUrl.substring(0, 10)}...`);
    }
    
    try {
      console.log('Initializing database connection...');
      _sql = neon(dbUrl);
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
  const directUrl = DATABASE_CONFIG.DIRECT_URL;
  
  if (!directUrl) {
    throw new Error('DIRECT_URL environment variable is not set');
  }
  
  try {
    const directSql = neon(directUrl);
    return drizzle(directSql);
  } catch (error) {
    console.error('Failed to initialize direct database connection:', error);
    throw new Error(`Direct database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};