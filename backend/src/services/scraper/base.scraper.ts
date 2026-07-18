import { logger } from '../../utils/logger';
import type { ScrapedCourse, ScraperConfig } from './scraper.types';

/**
 * Abstract base class implementing the Template Method pattern.
 * Subclasses override `scrapeCourses()` — `run()` handles retry, timing, and logging.
 */
export abstract class BaseScraper {
  protected readonly universityId: string;
  protected readonly universityName: string;
  protected readonly universityUrl: string;
  protected readonly config: ScraperConfig;

  constructor(
    universityId: string,
    universityName: string,
    universityUrl: string,
    config: ScraperConfig
  ) {
    this.universityId = universityId;
    this.universityName = universityName;
    this.universityUrl = universityUrl;
    this.config = config;
  }

  // ── Abstract: must be implemented by each adapter ─────────────────────────
  protected abstract scrapeCourses(): Promise<ScrapedCourse[]>;

  // ── Public: orchestrated run with retry logic ──────────────────────────────
  async run(): Promise<ScrapedCourse[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.info(
          `[${this.universityName}] Scraping attempt ${attempt}/${this.config.maxRetries}`
        );
        const courses = await this.scrapeCourses();
        logger.info(
          `[${this.universityName}] ✅ Scraped ${courses.length} courses on attempt ${attempt}`
        );
        return courses;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const delayMs = this.config.retryDelayMs * Math.pow(2, attempt - 1); // exponential backoff
        logger.warn(
          `[${this.universityName}] Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms…`
        );

        if (attempt < this.config.maxRetries) {
          await this.delay(delayMs);
        }
      }
    }

    const finalMsg = `[${this.universityName}] ❌ All ${this.config.maxRetries} attempts failed. Last error: ${lastError?.message}`;
    logger.error(finalMsg);
    throw lastError ?? new Error('Unknown scraper failure');
  }

  // ── Protected: HTTP fetch with timeout ────────────────────────────────────
  protected async fetchUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      logger.debug(`[${this.universityName}] Fetching: ${url}`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudyAbroadBot/1.0; +https://studyabroad.de/bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Protected: sleep helper ───────────────────────────────────────────────
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Protected: utility — normalise degree text ────────────────────────────
  protected parseDegree(text: string): ScrapedCourse['degree'] {
    const t = text.toLowerCase();
    if (t.includes('bachelor') || t.includes('b.sc') || t.includes('b.eng')) return 'BACHELOR';
    if (t.includes('master') || t.includes('m.sc') || t.includes('m.eng') || t.includes('msc'))
      return 'MASTER';
    if (t.includes('phd') || t.includes('ph.d') || t.includes('doctorate') || t.includes('doktor'))
      return 'PHD';
    if (t.includes('diploma') || t.includes('diplom')) return 'DIPLOMA';
    if (t.includes('certificate') || t.includes('zertifikat')) return 'CERTIFICATE';
    return 'MASTER'; // most scraped programs are master's
  }

  // ── Protected: infer field from course name ───────────────────────────────
  protected inferField(name: string): string {
    const n = name.toLowerCase();
    if (
      n.includes('computer') ||
      n.includes('software') ||
      n.includes('informatics') ||
      n.includes('ai') ||
      n.includes('machine learning') ||
      n.includes('data science')
    )
      return 'Computer Science';
    if (n.includes('electrical') || n.includes('electronics')) return 'Electrical Engineering';
    if (n.includes('mechanical') || n.includes('automotive')) return 'Mechanical Engineering';
    if (n.includes('civil') || n.includes('structural') || n.includes('construction'))
      return 'Civil Engineering';
    if (
      n.includes('business') ||
      n.includes('management') ||
      n.includes('mba') ||
      n.includes('economics')
    )
      return 'Business & Management';
    if (n.includes('physics') || n.includes('quantum')) return 'Physics';
    if (n.includes('chemistry') || n.includes('chemical')) return 'Chemistry';
    if (n.includes('biology') || n.includes('biomedical') || n.includes('biotechnology'))
      return 'Biology';
    if (n.includes('medicine') || n.includes('medical') || n.includes('clinical'))
      return 'Medicine';
    if (n.includes('architecture') || n.includes('urban')) return 'Architecture';
    if (n.includes('law') || n.includes('legal')) return 'Law';
    if (n.includes('psychology')) return 'Psychology';
    if (n.includes('mathematics') || n.includes('statistics')) return 'Mathematics';
    if (n.includes('energy') || n.includes('renewable') || n.includes('environment'))
      return 'Environmental Science';
    return 'Engineering'; // default
  }

  // ── Protected: detect teaching language ──────────────────────────────────
  protected parseLanguage(text: string): ScrapedCourse['language'] {
    const t = text.toLowerCase();
    if (t.includes('german/english') || t.includes('english/german') || t.includes('bilingual'))
      return 'BILINGUAL';
    if (t.includes('german') || t.includes('deutsch')) return 'GERMAN';
    return 'ENGLISH';
  }

  // ── Protected: parse duration from text like "4 semesters" ───────────────
  protected parseDuration(text: string): number | undefined {
    const semMatch = text.match(/(\d+)\s*sem/i);
    if (semMatch) return parseInt(semMatch[1], 10);
    const yearMatch = text.match(/(\d+)\s*year/i);
    if (yearMatch) return parseInt(yearMatch[1], 10) * 2;
    return undefined;
  }

  // ── Protected: parse fee from text like "€ 1,500 per semester" ───────────
  protected parseFee(text: string): number | undefined {
    const cleaned = text.replace(/[,_]/g, '');
    const match = cleaned.match(/(?:€|EUR|eur)?\s*(\d+(?:\.\d+)?)/i);
    if (match) {
      const val = parseFloat(match[1]);
      return val > 0 && val < 50_000 ? val : undefined;
    }
    if (/free|no.*fee|0\s*€/i.test(text)) return 0;
    return undefined;
  }
}
