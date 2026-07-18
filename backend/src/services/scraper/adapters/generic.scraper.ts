import * as cheerio from 'cheerio';
import { BaseScraper } from '../base.scraper';
import { logger } from '../../../utils/logger';
import { assessProgramName, hasDegreeSignal, MAX_PROGRAM_NAME_LENGTH } from '../name-quality';
import type { ScrapedCourse, ScraperConfig } from '../scraper.types';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Generic fallback scraper — handles universities without a custom adapter.
 * Looks for common HTML patterns used by most university websites.
 */
export class GenericScraper extends BaseScraper {
  constructor(
    universityId: string,
    universityName: string,
    universityUrl: string,
    config: ScraperConfig
  ) {
    super(universityId, universityName, universityUrl, config);
  }

  protected async scrapeCourses(): Promise<ScrapedCourse[]> {
    const html = await this.fetchUrl(this.universityUrl);
    const $ = cheerio.load(html) as CheerioRoot;
    const courses: ScrapedCourse[] = [];
    const seenNames = new Set<string>();

    const addCourse = (course: ScrapedCourse | null) => {
      if (!course) return;
      const key = course.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenNames.has(key)) return; // duplicate menu entry
      seenNames.add(key);
      courses.push(course);
    };

    // ── Selectors to try in order of specificity ────────────────────────────
    const selectors = [
      '[data-course]',
      '.course-card',
      '.program-card',
      '.study-program',
      '.degree-program',
      '.program-item',
      '[role="article"]',
      'article.course',
      'article.program',
      '.card:has(h3)', // generic card with heading
    ];

    let found = false;

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      found = true;
      logger.debug(
        `[${this.universityName}] Matched selector "${selector}" — ${elements.length} elements`
      );

      elements.each((_i: number, el: unknown) => {
        addCourse(this.extractCourseFromElement($, el as Parameters<typeof $>[0]));
      });

      if (courses.length > 0) break;
    }

    // ── Fallback: look for any list items with degree keywords ──────────────
    if (!found || courses.length === 0) {
      logger.warn(
        `[${this.universityName}] Generic selectors found nothing — trying keyword fallback`
      );
      $('li, td').each((_i: number, el: unknown) => {
        const text = $(el as Parameters<typeof $>[0])
          .text()
          .trim();
        if (this.looksLikeCourseName(text)) {
          addCourse(
            this.buildCourseFromText(
              text,
              $(el as Parameters<typeof $>[0])
                .find('a')
                .attr('href')
            )
          );
        }
      });
    }

    if (courses.length === 0) {
      logger.warn(`[${this.universityName}] No courses found — website structure may have changed`);
    }

    return courses;
  }

  // ── Extract a ScrapedCourse from a DOM element ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractCourseFromElement($: CheerioRoot, el: any): ScrapedCourse | null {
    const $el = $(el);

    // Name — try heading first, then any strong/bold
    const name =
      $el.find('h1,h2,h3,h4').first().text().trim() ||
      $el.find('strong,b').first().text().trim() ||
      $el.attr('data-course') ||
      '';

    if (!name || name.length < 3) return null;

    // Structural junk filter: nav keywords, over-long / concatenated menu text
    const nameIssues = assessProgramName(name);
    if (nameIssues.length > 0) {
      logger.debug(
        `[${this.universityName}] Skipping candidate "${name.slice(0, 60)}": ${nameIssues[0]}`
      );
      return null;
    }

    // Degree
    const degreeText =
      $el.find('[class*="degree"],[class*="level"],[data-degree]').text().trim() ||
      $el.text().trim();

    // Must carry a degree signal (Bachelor/Master/B.Sc./M.Sc./…) in the name
    // or its element context — otherwise it's a generic page link, not a program
    if (!hasDegreeSignal(name) && !hasDegreeSignal(degreeText)) {
      logger.debug(
        `[${this.universityName}] Skipping candidate "${name.slice(0, 60)}": no degree signal`
      );
      return null;
    }

    // Language
    const langText =
      $el.find('[class*="lang"],[class*="language"],[data-language]').text().trim() || '';

    // Duration
    const durationText =
      $el.find('[class*="duration"],[class*="semester"],[data-duration]').text().trim() || '';

    // Fee
    const feeText =
      $el.find('[class*="fee"],[class*="tuition"],[class*="cost"],[data-fee]').text().trim() || '';

    // URL
    const href = $el.find('a').first().attr('href') || $el.attr('data-url') || '';
    const courseUrl = href
      ? href.startsWith('http')
        ? href
        : `${this.universityUrl.replace(/\/$/, '')}/${href.replace(/^\//, '')}`
      : undefined;

    try {
      return {
        name: name.slice(0, MAX_PROGRAM_NAME_LENGTH),
        degree: this.parseDegree(degreeText),
        field: this.inferField(name),
        language: this.parseLanguage(langText || name),
        durationSemesters: this.parseDuration(durationText),
        tuitionFeeEuros: this.parseFee(feeText),
        courseUrl: courseUrl && courseUrl.startsWith('http') ? courseUrl : undefined,
      };
    } catch {
      return null;
    }
  }

  // ── Quick heuristic — does this text look like a program name? ────────────
  private looksLikeCourseName(text: string): boolean {
    if (text.length < 5 || text.length > MAX_PROGRAM_NAME_LENGTH) return false;
    // Requires an explicit degree signal — generic keywords like "science"
    // or "management" alone match too much navigation text
    if (!hasDegreeSignal(text)) return false;
    return assessProgramName(text).length === 0;
  }

  // ── Build a minimal course from plain text ────────────────────────────────
  private buildCourseFromText(text: string, href?: string): ScrapedCourse | null {
    if (!text || text.length < 5) return null;
    try {
      const courseUrl = href && href.startsWith('http') ? href : undefined;
      return {
        name: text.slice(0, MAX_PROGRAM_NAME_LENGTH),
        degree: this.parseDegree(text),
        field: this.inferField(text),
        language: this.parseLanguage(text),
        courseUrl,
      };
    } catch {
      return null;
    }
  }
}
