/**
 * Phase 5 Migration Script
 *
 * Backfills all existing Course records with Phase 5 program intelligence data:
 *   1. Creates ProgramIntake records from legacy intakeWinter/intakeSummer flags
 *   2. Creates ProgramFee records from legacy tuitionFeeEuros
 *   3. Creates ProgramRequirement records from legacy ieltsMinimum/gpaMinimum
 *   4. Creates ProgramModule records from legacy curriculum JSON
 *   5. Calculates completenessScore for every course
 *   6. Sets isMatchEligible via ProgramValidator
 *   7. Creates initial ProgramHistory "MIGRATION" record for each course
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register prisma/migrations/migrate_programs.ts
 */

import { PrismaClient } from '@prisma/client';
import { ProgramCompletenessService } from '../../src/features/program-quality/services/completeness.service';
import { ProgramValidator } from '../../src/features/program-quality/services/validator.service';

const prisma = new PrismaClient();
const completenessService = new ProgramCompletenessService();
const validator = new ProgramValidator();

// ── Stats counters ────────────────────────────────────────────────────────────
const stats = {
  totalCourses: 0,
  intakesCreated: 0,
  feesCreated: 0,
  requirementsCreated: 0,
  modulesCreated: 0,
  historyCreated: 0,
  scoresCalculated: 0,
  validationsDone: 0,
  errors: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDeadlineString(deadlineStr: string | null | undefined): Date | null {
  if (!deadlineStr) return null;
  // Try to parse "May 31", "November 30", or ISO dates
  const currentYear = new Date().getFullYear();
  const parsed = new Date(`${deadlineStr} ${currentYear}`);
  if (!isNaN(parsed.getTime())) return parsed;
  const direct = new Date(deadlineStr);
  if (!isNaN(direct.getTime())) return direct;
  return null;
}

// ── Main migration ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Phase 5 Migration: Starting...\n');

  const courses = await prisma.course.findMany({
    include: {
      requirements: true,
      modules: true,
      intakes: true,
      fees: true,
    },
  });

  stats.totalCourses = courses.length;
  console.log(`📦 Found ${courses.length} courses to migrate\n`);

  for (const course of courses) {
    try {
      console.log(`  Processing: ${course.name} (${course.id})`);

      // ── 1. ProgramIntake ────────────────────────────────────────────────────
      if (course.intakeWinter && course.intakes.every((i) => i.intakeSeason !== 'WINTER')) {
        const deadline =
          course.applicationDeadlineWinter ??
          parseDeadlineString(null) ??
          new Date(new Date().getFullYear(), 5 - 1, 31); // Default: May 31

        await prisma.programIntake.create({
          data: {
            courseId: course.id,
            intakeSeason: 'WINTER',
            applicationDeadline: deadline,
          },
        });
        stats.intakesCreated++;
      }

      if (course.intakeSummer && course.intakes.every((i) => i.intakeSeason !== 'SUMMER')) {
        const deadline =
          course.applicationDeadlineSummer ?? new Date(new Date().getFullYear(), 11 - 1, 30); // Default: Nov 30

        await prisma.programIntake.create({
          data: {
            courseId: course.id,
            intakeSeason: 'SUMMER',
            applicationDeadline: deadline,
          },
        });
        stats.intakesCreated++;
      }

      // ── 2. ProgramFee ───────────────────────────────────────────────────────
      if (course.tuitionFeeEuros != null && course.fees.every((f) => f.feeType !== 'TUITION')) {
        await prisma.programFee.create({
          data: {
            courseId: course.id,
            feeType: 'TUITION',
            amount: course.tuitionFeeEuros,
            currency: 'EUR',
            description: 'Tuition fee per semester',
            applicableIntakes: [],
          },
        });
        stats.feesCreated++;
      }

      // Typical German semester contribution (~350 EUR)
      if (course.fees.every((f) => f.feeType !== 'SEMESTER_FEE')) {
        await prisma.programFee.create({
          data: {
            courseId: course.id,
            feeType: 'SEMESTER_FEE',
            amount: 350,
            currency: 'EUR',
            description: 'Semester contribution (Semesterbeitrag) — includes student transport',
            applicableIntakes: [],
          },
        });
        stats.feesCreated++;
      }

      // ── 3. ProgramRequirement ───────────────────────────────────────────────
      if (!course.requirements) {
        await prisma.programRequirement.create({
          data: {
            courseId: course.id,
            ieltsMinimum: course.ieltsMinimum ?? undefined,
            gpaMinimum: course.gpaMinimum ?? undefined,
            languageRequirements: [],
            additionalCertificates: [],
          },
        });
        stats.requirementsCreated++;
      }

      // ── 4. ProgramModule (from curriculum JSON) ─────────────────────────────
      if (course.modules.length === 0 && course.curriculum) {
        const curricArr: string[] = Array.isArray(course.curriculum)
          ? (course.curriculum as string[])
          : [];
        for (let idx = 0; idx < curricArr.length; idx++) {
          const moduleName = curricArr[idx];
          if (typeof moduleName === 'string' && moduleName.trim()) {
            await prisma.programModule.create({
              data: {
                courseId: course.id,
                name: moduleName.trim(),
                semester: Math.ceil((idx + 1) / 2), // Spread across semesters
                isRequired: true,
              },
            });
            stats.modulesCreated++;
          }
        }
      }

      // ── 5. ProgramHistory (initial migration record) ────────────────────────
      const historyCount = await prisma.programHistory.count({ where: { courseId: course.id } });
      if (historyCount === 0) {
        await prisma.programHistory.create({
          data: {
            courseId: course.id,
            fieldName: 'migration',
            oldValue: null,
            newValue: { phase: 5, migratedAt: new Date().toISOString() },
            changedBy: 'MIGRATION',
            reason:
              'Phase 5 data migration — backfilled ProgramIntake, ProgramFee, ProgramRequirement, ProgramModule',
          },
        });
        stats.historyCreated++;
      }

      // ── 6. Completeness Score ───────────────────────────────────────────────
      await completenessService.calculate(course.id);
      stats.scoresCalculated++;

      // ── 7. Match Eligibility ────────────────────────────────────────────────
      await validator.validateForMatching(course.id);
      stats.validationsDone++;
    } catch (err) {
      console.error(`  ❌ Error processing ${course.name}: ${String(err)}`);
      stats.errors++;
    }
  }

  // ── Print summary ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Phase 5 Migration Complete!\n');
  console.log(`  Total courses:         ${stats.totalCourses}`);
  console.log(`  Intakes created:       ${stats.intakesCreated}`);
  console.log(`  Fees created:          ${stats.feesCreated}`);
  console.log(`  Requirements created:  ${stats.requirementsCreated}`);
  console.log(`  Modules created:       ${stats.modulesCreated}`);
  console.log(`  History records:       ${stats.historyCreated}`);
  console.log(`  Scores calculated:     ${stats.scoresCalculated}`);
  console.log(`  Validations done:      ${stats.validationsDone}`);
  console.log(`  Errors:                ${stats.errors}`);

  if (stats.errors === 0) {
    console.log('\n🎉 All courses migrated without errors!');
  } else {
    console.log('\n⚠️  Some courses had errors. Check logs above.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
