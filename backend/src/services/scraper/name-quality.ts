/**
 * Shared heuristics for deciding whether a scraped string is a genuine
 * degree-program name or website junk (navigation menus, faculty pages,
 * info-event announcements, concatenated menu text).
 *
 * Used by:
 *   - GenericScraper       — to filter candidates at extraction time
 *   - ProgramValidator     — stage 1 (pre-DB) and stage 2 (match eligibility)
 */

export const MAX_PROGRAM_NAME_LENGTH = 120;

/**
 * Navigation / non-program keywords seen on German university websites.
 * A program name containing any of these is menu or info-page text,
 * not a degree program.
 */
const NAV_KEYWORDS = [
  // German navigation & info pages
  'zurück',
  'verzeichnis',
  'infotag',
  'studienangebot',
  'studieninfo',
  'studienbewerber',
  'bewerbung', // "Bewerbung Bachelorstudium" = application info page
  'studiengangsmanagement',
  'studienabschlüsse',
  'studiengänge', // "Masterstudiengänge", "Alle Master-Studiengänge" = catalog pages
  'studium mit abschluss',
  'nach dem studium',
  'master und promotion',
  'erweiterungsmaster',
  'doppelmaster-programme',
  'fakultät',
  // English navigation & institutional pages
  'submenu',
  'faculty ', // "Faculty 1", "Faculty of ..." landing pages
  'open science',
  'tryscience',
  'infoday',
  'info day',
  'a-z',
  'campus',
  'research center',
  'research centre',
  'science events',
  'technology transfer',
  'where science meets',
  'lifecycle management',
  'quality management in teaching',
  'cross-registration',
  'auditing students',
];

/**
 * Signals that a string refers to an actual degree. Word-boundary anchored
 * so "Masterstudiengänge" (menu page) does not match "master".
 */
const DEGREE_SIGNAL_REGEX =
  /(?:\b(?:bachelor|master|phd|ph\.d|doctorate|promotion|staatsexamen|diplom|mba)\b|\b[bm]\.?\s?(?:sc|a|ed|eng)\b|\bll\.?m\b|\b(?:bsc|msc|beng|meng)\b)/i;

/**
 * Lowercase letter directly followed by an uppercase letter — the signature
 * of concatenated menu items ("StudienangebotZurückVerzeichnis…").
 * Allows a single leading joint (e.g. brand names like "TryScience" are
 * already caught by NAV_KEYWORDS); two or more joints is always junk.
 */
const CONCATENATION_REGEX = /[a-zäöüß][A-ZÄÖÜ]/g;

export function hasDegreeSignal(text: string): boolean {
  return DEGREE_SIGNAL_REGEX.test(text);
}

/**
 * Structural junk checks that apply to any program name, scraped or stored.
 * Returns a list of human-readable issues; empty list = name looks clean.
 *
 * Deliberately does NOT require a degree signal — stored courses carry the
 * degree in a separate column. Use `hasDegreeSignal` on the extraction
 * context for that check.
 */
export function assessProgramName(name: string): string[] {
  const issues: string[] = [];
  const trimmed = (name ?? '').trim();

  if (trimmed.length < 3) {
    issues.push('name is missing or too short');
    return issues;
  }

  if (trimmed.length > MAX_PROGRAM_NAME_LENGTH) {
    issues.push(
      `name is ${trimmed.length} chars (max ${MAX_PROGRAM_NAME_LENGTH}) — likely concatenated page text`
    );
  }

  if (/[\r\n\t]/.test(trimmed)) {
    issues.push('name contains line breaks — likely multiple menu items');
  }

  const lower = trimmed.toLowerCase();
  const navHit = NAV_KEYWORDS.find((k) => lower.includes(k));
  if (navHit) {
    issues.push(`name contains navigation keyword "${navHit}"`);
  }

  const joints = trimmed.match(CONCATENATION_REGEX);
  if (joints && joints.length >= 2) {
    issues.push('name looks like concatenated menu items (repeated mid-word capitals)');
  }

  return issues;
}

/**
 * Convenience: true when the name passes all structural junk checks.
 */
export function isPlausibleProgramName(name: string): boolean {
  return assessProgramName(name).length === 0;
}
