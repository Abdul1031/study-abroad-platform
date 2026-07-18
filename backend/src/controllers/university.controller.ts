import { Request, Response } from 'express';
import { UniversityService } from '../services/university.service';
import type { UniversityQuery } from '../services/university.service';
import { UniversityRepository } from '../repositories/university.repository';
import { prisma } from '../config/prisma';
import { appCache, CacheTtl } from '../services/cache/cache.service';

const universityService = new UniversityService(new UniversityRepository(prisma.university));

const PAGE_SIZE = 20;

/** "Munich,Berlin" → ['Munich', 'Berlin'] (trimmed, empties dropped) */
function csv(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length ? parts : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const listUniversities = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;

    const sortByRaw = req.query.sortBy as string | undefined;
    const query: UniversityQuery = {
      // `q` is canonical; `name` accepted for backwards compatibility
      q: (req.query.q as string) || (req.query.name as string) || undefined,
      cities: csv(req.query.city),
      states: csv(req.query.state),
      types: csv(req.query.type),
      degrees: csv(req.query.degree),
      fields: csv(req.query.field),
      languages: csv(req.query.language),
      intakes: csv(req.query.intake),
      tuitionMin: num(req.query.tuitionMin),
      tuitionMax: num(req.query.tuitionMax),
      hasDormitory: req.query.hasDormitory === 'true',
      sortBy:
        sortByRaw === 'tuition' || sortByRaw === 'name' || sortByRaw === 'ranking'
          ? sortByRaw
          : 'ranking',
    };

    const cacheKey = `universities:list:${page}:${JSON.stringify(query)}`;
    const result = await appCache.getOrSet(cacheKey, CacheTtl.courseList, () =>
      universityService.getUniversities(query, page, PAGE_SIZE)
    );

    return res.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: page * PAGE_SIZE < result.total,
    });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const getUniversity = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const university = await universityService.getUniversityDetail(id);
    if (!university)
      return res.status(404).json({ success: false, message: 'University not found' });
    return res.json({ success: true, data: university });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const searchUniversities = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;

    const result = await universityService.searchUniversities(q, page);
    return res.json({ success: true, data: result.data, total: result.total, page });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const getUniversityCourses = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const university = await universityService.getUniversityDetail(id);
    if (!university)
      return res.status(404).json({ success: false, message: 'University not found' });
    return res.json({ success: true, data: (university as any).courses });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};
