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

import type { ScraperConfig } from '../services/scraper/scraper.types';

export const scraperConfig: Partial<ScraperConfig> = {
  requestTimeoutMs: parseInt(getEnv('SCRAPER_TIMEOUT_MS', '15000'), 10),
  rateLimitMs: parseInt(getEnv('SCRAPER_RATE_LIMIT_MS', '2000'), 10),
  maxRetries: parseInt(getEnv('SCRAPER_MAX_RETRIES', '3'), 10),
  maxConcurrentRequests: parseInt(getEnv('SCRAPER_MAX_CONCURRENT', '5'), 10),
  enabled: getEnv('SCRAPER_ENABLED', 'true') === 'true',
};
