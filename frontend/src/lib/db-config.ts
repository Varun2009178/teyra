// Hard-coded database connection strings for production
// These will be used if the environment variables are not properly loaded

export const DATABASE_CONFIG = {
  // Main pooled connection URL
  DATABASE_URL: "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  
  // Direct connection URL (for migrations, etc.)
  DIRECT_URL: "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
};