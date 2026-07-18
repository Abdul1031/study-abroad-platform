import { BaseRepository, IPaginatedResult } from './base.repository';
import { University, CreateUniversityDTO } from '../domain/university/university.types';
import { DEFAULT_PAGE_SIZE } from '../domain/university/university.constants';

export class UniversityRepository extends BaseRepository<
  University,
  CreateUniversityDTO,
  Partial<CreateUniversityDTO>
> {
  constructor(prismaDelegate: any) {
    super(prismaDelegate);
  }

  async findByCity(
    city: string,
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<University>> {
    return this.findMany({ city: { equals: city, mode: 'insensitive' } }, skip, take);
  }

  async findByCourseField(
    field: string,
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<University>> {
    const filter = {
      courses: {
        some: {
          field: { equals: field, mode: 'insensitive' },
        },
      },
    };
    return this.findMany(filter, skip, take);
  }

  async searchByName(
    query: string,
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<University>> {
    return this.findMany({ name: { contains: query, mode: 'insensitive' } }, skip, take);
  }

  async findWithCourses(id: string): Promise<University | null> {
    return this.delegate.findUnique({
      where: { id },
      include: {
        courses: { orderBy: [{ completenessScore: 'desc' }] },
        tags: true,
      },
    });
  }

  /** Filtered + ordered listing used by GET /api/universities */
  async findFiltered(
    where: object,
    orderBy: object[],
    skip: number = 0,
    take: number = DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResult<University>> {
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { _count: { select: { courses: true } } },
      }),
      this.delegate.count({ where }),
    ]);
    return { data, total };
  }
}
