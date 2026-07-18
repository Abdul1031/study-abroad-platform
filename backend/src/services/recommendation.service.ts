import { CourseRepository } from '../repositories/course.repository';
import { UniversityRepository } from '../repositories/university.repository';
import { MatchScore, EligibilityStatus } from '../domain/recommendation/recommendation.types';
import { Course } from '../domain/course/course.types';
import { prisma } from '../config/prisma';

export class RecommendationService {
  constructor(
    private courseRepo: CourseRepository,
    private univRepo: UniversityRepository
  ) {}

  async generateRecommendations(studentId: string): Promise<MatchScore[]> {
    // 1. Fetch student profile
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // 2. Fetch ONLY match-eligible active courses (Phase 5 quality gate)
    // isMatchEligible is set by ProgramValidator.validateForMatching()
    const allCoursesQuery = await this.courseRepo.findMany(
      { isActive: true, isMatchEligible: true },
      0,
      1000
    );
    const courses = allCoursesQuery.data;

    // Fetch all universities to map course to university quickly
    const universitiesQuery = await this.univRepo.findMany({ isActive: true }, 0, 100);
    const uniMap = new Map(universitiesQuery.data.map((u) => [u.id, u.name]));

    // 3. Score each course
    const results: MatchScore[] = [];

    for (const course of courses) {
      const breakdown = {
        academicFit: this.scoreAcademicFit(student.cgpa || 0, course.gpaMinimum),
        languageEligibility: this.scoreLanguage(student.ieltsScore || 0, course.ieltsMinimum),
        budgetFit: this.scoreBudget(student.budget || 0, course.tuitionFeeEuros),
        intakeMatch: this.scoreIntake(student.preferredIntake || '', course),
        fieldAlignment: this.scoreFieldAlignment(student.preferredCourse || '', course.field),
      };

      // 4. Calculate overall score
      const totalScore =
        breakdown.academicFit +
        breakdown.languageEligibility +
        breakdown.budgetFit +
        breakdown.intakeMatch +
        breakdown.fieldAlignment;

      // 5. Assign eligibilityStatus
      let eligibilityStatus: EligibilityStatus;
      if (totalScore >= 85) {
        eligibilityStatus = 'ELIGIBLE';
      } else if (totalScore >= 65) {
        eligibilityStatus = 'BORDERLINE';
      } else if (totalScore >= 40) {
        eligibilityStatus = 'STRETCH';
      } else {
        eligibilityStatus = 'INELIGIBLE';
      }

      results.push({
        courseId: course.id,
        courseName: course.name,
        universityId: course.universityId,
        universityName: uniMap.get(course.universityId) || 'Unknown University',
        totalScore: Math.round(totalScore * 10) / 10,
        eligibilityStatus,
        breakdown,
        courseDetails: course,
        // Phase 5: quality warnings surface to the student
        qualityWarnings:
          (course as unknown as { matchingWarnings?: string[] }).matchingWarnings ?? [],
      });
    }

    // Sort by descending score
    results.sort((a, b) => b.totalScore - a.totalScore);
    const top20 = results.slice(0, 20);

    // 6. Cache result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

    await prisma.recommendationCache.upsert({
      where: { studentId },
      update: {
        recommendations: top20 as any,
        expiresAt,
        generatedAt: new Date(),
      },
      create: {
        studentId,
        recommendations: top20 as any,
        expiresAt,
      },
    });

    // 7. Return top 20
    return top20;
  }

  private scoreAcademicFit(studentCgpa: number, requirement: number | null): number {
    if (requirement === null || requirement === 0) return 30; // No requirement = perfect fit
    if (studentCgpa === 0) return 0;

    // Using standard GPA assumption where higher is better.
    // If the system uses German CGPA (1.0 is best, 4.0 is worst), the logic would invert.
    // Assuming standard for now based on formula: (cgpa / min) * 30.
    let ratio = studentCgpa / requirement;
    if (ratio > 1) ratio = 1; // Cap at 30
    return ratio * 30;
  }

  private scoreLanguage(studentIelts: number, requirement: number | null): number {
    if (requirement === null || requirement === 0) return 25;
    if (studentIelts >= requirement) return 25;
    // Partial score if close
    if (studentIelts >= requirement - 0.5) return 15;
    if (studentIelts >= requirement - 1.0) return 5;
    return 0;
  }

  private scoreBudget(budget: number, fee: number | null): number {
    if (fee === null || fee === 0) return 20; // Free = perfect budget fit
    if (budget >= fee) return 20;
    if (budget === 0) return 0;

    const ratio = budget / fee;
    return ratio * 20;
  }

  private scoreIntake(studentIntake: string, course: Course): number {
    if (!studentIntake) return 15; // If student didn't specify, default to fit

    const pref = studentIntake.toLowerCase();
    if (pref === 'winter' && course.intakeWinter) return 15;
    if (pref === 'summer' && course.intakeSummer) return 15;

    return 0;
  }

  private scoreFieldAlignment(studentField: string, courseField: string): number {
    if (!studentField || !courseField) return 0;
    // Check if the strings match exactly or if one is contained in the other
    const sField = studentField.toLowerCase();
    const cField = courseField.toLowerCase();

    if (sField === cField || cField.includes(sField) || sField.includes(cField)) {
      return 10;
    }
    return 0;
  }
}
