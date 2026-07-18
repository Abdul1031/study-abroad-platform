import app from './app';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { initScraperScheduler, getScraperScheduler } from './services/scraper';
import { scraperConfig } from './config/env';

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);

  // ── Initialise & start the scraper scheduler ───────────────────────────────
  const scheduler = initScraperScheduler(prisma, scraperConfig);
  scheduler.start();
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  // Stop scraper first so any in-progress run can finish cleanly
  getScraperScheduler()?.stop();

  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
