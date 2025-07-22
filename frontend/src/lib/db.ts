import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for better performance
// fetchConnectionCache is now always true by default

// Initialize Neon client with pooled connection string from environment variable
const sql = neon(process.env.DATABASE_URL!);

// Initialize Drizzle ORM with the Neon client
export const db = drizzle(sql);

// For operations that need a direct connection (migrations, etc.)
export const getDirectDb = () => {
  const directSql = neon(process.env.DIRECT_URL!);
  return drizzle(directSql);
};