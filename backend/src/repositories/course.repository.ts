import { BaseRepository, IPaginatedResult } from './base.repository';
import { Course, CreateCourseDTO, FilterCourseDTO } from '../domain/course/course.types';
import { DEFAULT_PAGE_SIZE } from '../domain/university/university.constants'; // Reusing constant

export class CourseRepository extends BaseRepository<
  Course,
  CreateCourseDTO,
  Partial<CreateCourseDTO>
> {
  constructor(prismaDelegate: any) {
    super(prismaDelegate);
  }

  async findByUniversityId(universityId: string): Promise<Course[]> {
    return this.delegate.findMany({
      where: { universityId },
    });
  }

  async findByField(
    field: string,
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<Course>> {
    return this.findMany({ field: { equals: field, mode: 'insensitive' } }, skip, take);
  }

  async findByLanguage(
    language: string,
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<Course>> {
    return this.findMany({ language: { equals: language, mode: 'insensitive' } }, skip, take);
  }

  async findByCriteria(
    filter: FilterCourseDTO & { q?: string },
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<Course>> {
    const whereClause: any = {};
    if (filter.q) {
      whereClause.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { university: { name: { contains: filter.q, mode: 'insensitive' } } },
      ];
    }
    if (filter.field) whereClause.field = { equals: filter.field, mode: 'insensitive' };
    if (filter.degree) whereClause.degree = { equals: filter.degree, mode: 'insensitive' };
    if (filter.language) whereClause.language = { equals: filter.language, mode: 'insensitive' };
    if (filter.universityId) whereClause.universityId = filter.universityId;
    if (filter.intake) {
      if (filter.intake.toLowerCase() === 'winter') whereClause.intakeWinter = true;
      if (filter.intake.toLowerCase() === 'summer') whereClause.intakeSummer = true;
    }

    // Include the parent university (for display) and surface the
    // highest-quality programs first (backed by the Phase 5 composite index
    // on completenessScore + isMatchEligible).
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where: whereClause,
        skip,
        take,
        include: { university: { select: { name: true, city: true } } },
        orderBy: [{ isMatchEligible: 'desc' }, { completenessScore: 'desc' }],
      }),
      this.delegate.count({ where: whereClause }),
    ]);

    return { data, total };
  }
}
