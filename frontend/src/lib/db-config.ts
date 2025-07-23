// Database configuration helper
// This safely gets database URLs from environment variables

// Helper function to get environment variables safely
const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.warn(`Environment variable ${name} is not set`);
    return '';
  }
  return value;
};

export const DATABASE_CONFIG = {
  // Main pooled connection URL
  get DATABASE_URL(): string {
    return getEnvVar('DATABASE_URL');
  },
  
  // Direct connection URL (for migrations, etc.)
  get DIRECT_URL(): string {
    return getEnvVar('DIRECT_URL');
  }
};