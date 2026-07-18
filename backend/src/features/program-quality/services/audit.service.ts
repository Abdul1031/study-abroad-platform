import { prisma } from '../../../config/prisma';
import { logger } from '../../../utils/logger';
import type { ChangedBy } from '../models/program.types';
import { Prisma } from '@prisma/client';
import type { ProgramHistory } from '@prisma/client';

/**
 * ProgramAuditService
 *
 * Provides an immutable, append-only audit trail for all program changes.
 * Every field-level change (by scraper, admin, or system) is recorded in
 * ProgramHistory and the Course.lastChangedAt timestamp is updated.
 *
 * History records are NEVER modified or deleted.
 */
export class ProgramAuditService {
  // ── Core: Log a single field change ───────────────────────────────────────

  /**
   * Create an immutable ProgramHistory record and bump Course.lastChangedAt.
   *
   * @param courseId   - ID of the course that changed
   * @param fieldName  - Which field changed (e.g. "applicationDeadlineWinter")
   * @param oldValue   - Previous value (null for newly created fields)
   * @param newValue   - New value (null if field was cleared)
   * @param changedBy  - Who made the change: SCRAPER | ADMIN | SYSTEM | MIGRATION
   * @param reason     - Optional human-readable reason
   */
  async logChange(
    courseId: string,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    changedBy: ChangedBy,
    reason?: string
  ): Promise<ProgramHistory> {
    // Serialize values to JSON-compatible form
    const serialise = (v: unknown) => {
      if (v === null || v === undefined) return Prisma.JsonNull;
      if (v instanceof Date) return v.toISOString();
      return v as object; // primitives, arrays, objects are valid Prisma Json
    };

    const [history] = await prisma.$transaction([
      prisma.programHistory.create({
        data: {
          courseId,
          fieldName,
          oldValue: serialise(oldValue),
          newValue: serialise(newValue),
          changedBy,
          reason: reason ?? null,
        },
      }),
      prisma.course.update({
        where: { id: courseId },
        data: { lastChangedAt: new Date() },
      }),
    ]);

    logger.debug(
      `[Audit] ${fieldName} changed on course ${courseId} by ${changedBy}: ` +
        `${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`
    );

    return history;
  }

  /**
   * Log multiple field changes in a single DB transaction.
   * More efficient when the scraper updates many fields at once.
   */
  async logChanges(
    courseId: string,
    changes: Array<{ fieldName: string; oldValue: unknown; newValue: unknown }>,
    changedBy: ChangedBy,
    reason?: string
  ): Promise<number> {
    if (changes.length === 0) return 0;

    const serialise = (v: unknown) => {
      if (v === null || v === undefined) return Prisma.JsonNull;
      if (v instanceof Date) return v.toISOString();
      return v as object;
    };

    const historyCreates = changes.map((c) =>
      prisma.programHistory.create({
        data: {
          courseId,
          fieldName: c.fieldName,
          oldValue: serialise(c.oldValue),
          newValue: serialise(c.newValue),
          changedBy,
          reason: reason ?? null,
        },
      })
    );

    await prisma.$transaction([
      ...historyCreates,
      prisma.course.update({
        where: { id: courseId },
        data: { lastChangedAt: new Date() },
      }),
    ]);

    logger.debug(`[Audit] Logged ${changes.length} changes for course ${courseId} by ${changedBy}`);
    return changes.length;
  }

  // ── Query Helpers ─────────────────────────────────────────────────────────

  /**
   * Get full audit trail for a course, newest first.
   */
  async getHistory(courseId: string): Promise<ProgramHistory[]> {
    return prisma.programHistory.findMany({
      where: { courseId },
      orderBy: { changedAt: 'desc' },
    });
  }

  /**
   * Get changes made in the last N days.
   */
  async getChangedSince(courseId: string, sinceDays: number): Promise<ProgramHistory[]> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);

    return prisma.programHistory.findMany({
      where: {
        courseId,
        changedAt: { gte: since },
      },
      orderBy: { changedAt: 'desc' },
    });
  }

  /**
   * Check whether specific fields have changed recently (within sinceDays).
   */
  async hasChangedFields(courseId: string, fieldNames: string[], sinceDays = 30): Promise<boolean> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);

    const count = await prisma.programHistory.count({
      where: {
        courseId,
        fieldName: { in: fieldNames },
        changedAt: { gte: since },
      },
    });

    return count > 0;
  }

  /**
   * Compute a human-readable diff from two ProgramHistory records.
   * Useful for admin dashboard display.
   */
  formatChange(record: ProgramHistory): string {
    const old_ = record.oldValue === null ? '(none)' : JSON.stringify(record.oldValue);
    const new_ = record.newValue === null ? '(cleared)' : JSON.stringify(record.newValue);
    return `${record.fieldName}: ${old_} → ${new_} [by ${record.changedBy}]`;
  }

  /**
   * Diff an existing DB course against incoming scraped data and return
   * only fields that actually changed (avoid polluting history with no-ops).
   */
  diffCourse(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    fields: string[]
  ): Array<{ fieldName: string; oldValue: unknown; newValue: unknown }> {
    const changes: Array<{ fieldName: string; oldValue: unknown; newValue: unknown }> = [];

    for (const field of fields) {
      const old_ = existing[field];
      const new_ = incoming[field];

      // Skip if values are equal (handles null, undefined, primitive, and Date comparison)
      if (old_ instanceof Date && new_ instanceof Date) {
        if (old_.getTime() === new_.getTime()) continue;
      } else if (JSON.stringify(old_) === JSON.stringify(new_)) {
        continue;
      }

      changes.push({ fieldName: field, oldValue: old_, newValue: new_ });
    }

    return changes;
  }
}
