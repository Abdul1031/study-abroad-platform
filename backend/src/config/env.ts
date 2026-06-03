const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value || defaultValue || '';
};

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isProduction: getEnv('NODE_ENV', 'development') === 'production',
};
