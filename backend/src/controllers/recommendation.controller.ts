import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { CourseRepository } from '../repositories/course.repository';
import { UniversityRepository } from '../repositories/university.repository';
import { prisma } from '../config/prisma';

const recommendationService = new RecommendationService(
  new CourseRepository(prisma.course),
  new UniversityRepository(prisma.university)
);

export const generateRecommendations = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const recommendations = await recommendationService.generateRecommendations(studentId);
    return res.json({ success: true, data: recommendations });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;

    // Check cache first
    const cache = await prisma.recommendationCache.findUnique({
      where: { studentId },
    });

    if (cache && cache.expiresAt > new Date()) {
      return res.json({ success: true, data: cache.recommendations, cached: true });
    }

    // Generate if not cached or expired
    const recommendations = await recommendationService.generateRecommendations(studentId);
    return res.json({ success: true, data: recommendations, cached: false });
  } catch (error: unknown) {
    return res
      .status(500)
      .json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
};
