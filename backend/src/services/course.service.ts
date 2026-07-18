import { CourseRepository } from '../repositories/course.repository';
import { UniversityRepository } from '../repositories/university.repository';
import { FilterCourseDTO } from '../domain/course/course.types';

export class CourseService {
  constructor(
    private courseRepo: CourseRepository,
    private univRepo: UniversityRepository
  ) {}

  async getCourses(filters: FilterCourseDTO, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    return this.courseRepo.findByCriteria(filters, skip, pageSize);
  }

  async getCourseDetail(id: string) {
    const course = await this.courseRepo.findById(id);
    if (!course) return null;

    const university = await this.univRepo.findById(course.universityId);
    return {
      ...course,
      university,
    };
  }

  async getCoursesForUniversity(universityId: string) {
    return this.courseRepo.findByUniversityId(universityId);
  }
}
