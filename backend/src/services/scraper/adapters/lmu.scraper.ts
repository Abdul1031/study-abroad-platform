import * as cheerio from 'cheerio';
import { BaseScraper } from '../base.scraper';
import { logger } from '../../../utils/logger';
import type { ScrapedCourse, ScraperConfig } from '../scraper.types';

/**
 * LMU Munich specific scraper.
 * Targets: https://www.lmu.de/en/study/all-degrees-and-programs/
 *
 * LMU uses a filterable course catalog with the following HTML patterns:
 *
 *   <div class="course-teaser">          ← one block per program
 *     <h3 class="course-teaser__title">  ← program name
 *     <ul class="course-teaser__meta">   ← meta list (degree, lang, duration)
 *       <li data-label="Degree">M.Sc.</li>
 *       <li data-label="Language">English</li>
 *       <li data-label="Standard period of study">4 semesters</li>
 *     </ul>
 *     <a class="course-teaser__link">    ← detail URL
 *   </div>
 */
export class LMUMunichScraper extends BaseScraper {
  private static readonly CATALOG_URL = 'https://www.lmu.de/en/study/all-degrees-and-programs/';

  // LMU also exposes a search endpoint returning HTML fragments
  private static readonly SEARCH_URL =
    'https://www.lmu.de/en/study/all-degrees-and-programs/?tx_lmustudy_courselist[action]=list&tx_lmustudy_courselist[controller]=Course';

  constructor(
    universityId: string,
    universityName: string,
    universityUrl: string,
    config: ScraperConfig
  ) {
    super(universityId, universityName, universityUrl, config);
  }

  protected async scrapeCourses(): Promise<ScrapedCourse[]> {
    // Try main catalog page first
    const courses = await this.parseCatalogPage(LMUMunichScraper.CATALOG_URL);

    if (courses.length === 0) {
      logger.debug(`[LMU] Main catalog empty — trying search endpoint`);
      return await this.parseCatalogPage(LMUMunichScraper.SEARCH_URL);
    }

    return courses;
  }

  // ── Parse the LMU course catalog HTML ─────────────────────────────────────
  private async parseCatalogPage(url: string): Promise<ScrapedCourse[]> {
    const html = await this.fetchUrl(url);
    const $ = cheerio.load(html);
    const courses: ScrapedCourse[] = [];

    /*
     * Primary selector chain for LMU's course listing:
     *   .course-teaser  → modern redesign (2023+)
     *   .program-item   → older layout
     *   tr[data-degree] → table-based layout
     */
    const selectors = [
      '.course-teaser',
      '.program-item',
      '[class*="course-item"]',
      '[class*="studiengang"]',
      'tr[data-degree]',
    ].join(',');

    $(selectors).each((_i, el) => {
      const course = this.extractLMUCourse($, el);
      if (course) courses.push(course);
    });

    // Table-row fallback (older LMU pages)
    if (courses.length === 0) {
      $('table').each((_i, table) => {
        $(table)
          .find('tr')
          .each((_j, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const name = cells.eq(0).text().trim();
              const degreeText = cells.eq(1).text().trim();
              if (this.looksLikeProgramName(name)) {
                courses.push({
                  name: name.slice(0, 300),
                  degree: this.parseDegree(degreeText || name),
                  field: this.inferField(name),
                  language: 'ENGLISH',
                  tuitionFeeEuros: 0, // LMU is tuition-free
                });
              }
            }
          });
      });
    }

    logger.info(`[LMU] Extracted ${courses.length} programs from ${url}`);
    return courses;
  }

  // ── Extract a course from a .course-teaser element ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractLMUCourse($: ReturnType<typeof cheerio.load>, el: any): ScrapedCourse | null {
    const $el = $(el);

    // Name
    const name =
      $el.find('.course-teaser__title, .program-title, h2, h3, h4').first().text().trim() ||
      $el.find('strong').first().text().trim();

    if (!name || name.length < 4) return null;

    // Meta list: LMU uses <li data-label="…"> pattern
    const getMeta = (label: string): string =>
      $el.find(`li[data-label="${label}"], [data-meta="${label}"]`).text().trim() ||
      $el
        .find(`[class*="${label.toLowerCase().replace(/\s+/g, '-')}"]`)
        .text()
        .trim();

    const degreeText = getMeta('Degree') || getMeta('Abschluss') || '';
    const langText =
      getMeta('Language') ||
      getMeta('Language of instruction') ||
      getMeta('Unterrichtssprache') ||
      '';
    const durationText = getMeta('Standard period of study') || getMeta('Regelstudienzeit') || '';

    // Detail URL
    const href = $el.find('a.course-teaser__link, a').first().attr('href') ?? '';
    const courseUrl = href.startsWith('http')
      ? href
      : href
        ? `https://www.lmu.de${href}`
        : undefined;

    return {
      name: name.slice(0, 300),
      degree: this.parseDegree(degreeText || name),
      field: this.inferField(name),
      language: this.parseLanguage(langText || 'English'),
      durationSemesters: this.parseDuration(durationText),
      tuitionFeeEuros: 0, // LMU is tuition-free (only semester contribution)
      courseUrl,
    };
  }

  // ── Quick heuristic ────────────────────────────────────────────────────────
  private looksLikeProgramName(text: string): boolean {
    if (text.length < 5 || text.length > 200) return false;
    const keywords = [
      'master',
      'bachelor',
      'msc',
      'bsc',
      'science',
      'engineering',
      'management',
      'studies',
      'technology',
      'medicine',
      'law',
      'arts',
    ];
    const t = text.toLowerCase();
    return keywords.some((k) => t.includes(k));
  }
}
