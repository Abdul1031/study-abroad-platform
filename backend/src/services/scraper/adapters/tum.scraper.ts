import * as cheerio from 'cheerio';
import { BaseScraper } from '../base.scraper';
import { logger } from '../../../utils/logger';
import type { ScrapedCourse, ScraperConfig } from '../scraper.types';

/**
 * TU Munich (TUM) specific scraper.
 * Targets: https://www.tum.de/en/studies/degree-programs
 * TUM uses a filterable table / card grid with class names like
 * ".ry_studiengang", ".ct_program", or a React-driven JSON endpoint.
 */
export class TUMunichScraper extends BaseScraper {
  // TUM's degree programs search page (English)
  private static readonly PROGRAMS_URL =
    'https://www.tum.de/en/studies/degree-programs/detail/index';

  // JSON API endpoint TUM uses internally for their program list
  private static readonly API_URL = 'https://www.tum.de/en/studies/degree-programs/index.json';

  constructor(
    universityId: string,
    universityName: string,
    universityUrl: string,
    config: ScraperConfig
  ) {
    super(universityId, universityName, universityUrl, config);
  }

  protected async scrapeCourses(): Promise<ScrapedCourse[]> {
    // Attempt 1: internal JSON API (fastest + most structured)
    const jsonCourses = await this.tryJsonApi();
    if (jsonCourses.length > 0) return jsonCourses;

    // Attempt 2: parse the HTML programs listing page
    logger.debug(`[TUM] JSON API returned nothing — falling back to HTML parse`);
    return await this.parseHtmlListing();
  }

  // ── Strategy 1: TUM JSON endpoint ─────────────────────────────────────────
  private async tryJsonApi(): Promise<ScrapedCourse[]> {
    try {
      const text = await this.fetchUrl(TUMunichScraper.API_URL);
      const data = JSON.parse(text) as unknown;

      if (!data || !Array.isArray((data as Record<string, unknown>)['programs'])) return [];

      const programs = (data as { programs: Record<string, unknown>[] }).programs;
      logger.info(`[TUM] JSON API returned ${programs.length} programs`);

      return programs.flatMap((p) => this.mapJsonProgram(p)).filter(Boolean) as ScrapedCourse[];
    } catch {
      // JSON API not available / changed — fall through to HTML
      return [];
    }
  }

  private mapJsonProgram(p: Record<string, unknown>): ScrapedCourse | null {
    const name = String(p['title'] ?? p['name'] ?? '').trim();
    if (!name) return null;

    const degreeRaw = String(p['degree'] ?? p['level'] ?? '').trim();
    const langRaw = String(p['language'] ?? '').trim();
    const durationRaw = String(p['duration'] ?? '').trim();
    const feeRaw = String(p['fee'] ?? p['tuition'] ?? '').trim();
    const url = String(p['url'] ?? p['link'] ?? '').trim();

    return {
      name: name.slice(0, 300),
      degree: this.parseDegree(degreeRaw || name),
      field: this.inferField(name),
      language: this.parseLanguage(langRaw || 'English'),
      durationSemesters: this.parseDuration(durationRaw),
      tuitionFeeEuros: this.parseFee(feeRaw) ?? 0, // TUM is tuition-free for most programs
      courseUrl: url.startsWith('http') ? url : url ? `https://www.tum.de${url}` : undefined,
    };
  }

  // ── Strategy 2: HTML page parse ───────────────────────────────────────────
  private async parseHtmlListing(): Promise<ScrapedCourse[]> {
    const html = await this.fetchUrl(TUMunichScraper.PROGRAMS_URL);
    const $ = cheerio.load(html);
    const courses: ScrapedCourse[] = [];

    /*
     * TUM program listing HTML structure (as of 2024):
     *
     * <div class="ry_studiengang">            ← one card per program
     *   <h3 class="ry_studiengang__title">    ← program name
     *   <p class="ry_studiengang__degree">    ← degree type (M.Sc., B.Sc. …)
     *   <p class="ry_studiengang__lang">      ← teaching language
     *   <a class="ry_studiengang__link">      ← detail page link
     * </div>
     *
     * Fallback: generic card patterns
     */

    const cardSelector = [
      '.ry_studiengang',
      '.ct_program-card',
      '[data-type="program"]',
      '.program-row',
      'table.programs tr',
    ].join(',');

    $(cardSelector).each((_i, el) => {
      const $el = $(el);

      const name =
        $el.find('.ry_studiengang__title, .program-title, h2, h3, h4').first().text().trim() ||
        $el.find('td').first().text().trim();

      if (!name || name.length < 4) return;

      const degreeText = $el
        .find('.ry_studiengang__degree, .degree-badge, [class*="degree"]')
        .text()
        .trim();
      const langText = $el.find('.ry_studiengang__lang, [class*="language"]').text().trim();
      const href = $el.find('a').first().attr('href') ?? '';

      courses.push({
        name: name.slice(0, 300),
        degree: this.parseDegree(degreeText || name),
        field: this.inferField(name),
        language: this.parseLanguage(langText || 'English'),
        tuitionFeeEuros: 0, // TUM charges ~€144 semester contribution, not tuition
        courseUrl: href.startsWith('http') ? href : href ? `https://www.tum.de${href}` : undefined,
      });
    });

    logger.info(`[TUM] HTML parse extracted ${courses.length} programs`);
    return courses;
  }
}
