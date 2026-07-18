import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { CourseRepository } from '../repositories/course.repository';
import { UniversityRepository } from '../repositories/university.repository';
import { prisma } from '../config/prisma';
import { appCache, CacheTtl } from '../services/cache/cache.service';

const courseService = new CourseService(
  new CourseRepository(prisma.course),
  new UniversityRepository(prisma.university)
);

export const listCourses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const q = (req.query.q as string) || undefined;
    const degree = req.query.degree as string;
    const field = req.query.field as string;
    const language = req.query.language as string;
    const intake = req.query.intake as string;

    const cacheKey = `courses:list:${page}:${q ?? ''}:${degree ?? ''}:${field ?? ''}:${language ?? ''}:${intake ?? ''}`;
    const result = await appCache.getOrSet(cacheKey, CacheTtl.courseList, () =>
      courseService.getCourses({ q, degree, field, language, intake }, page)
    );
    return res.json({ success: true, data: result.data, total: result.total, page });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const getCourse = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const course = await appCache.getOrSet(`courses:detail:${id}`, CacheTtl.courseDetail, () =>
      courseService.getCourseDetail(id)
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    return res.json({ success: true, data: course });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};
