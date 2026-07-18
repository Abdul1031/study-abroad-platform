import { Router, Request, Response } from 'express';
import * as recommendationController from '../controllers/recommendation.controller';
import { UniversityRecommendationService } from '../services/university-recommendation.service';
import { requireAuth, requireSelfOrAdmin } from '../middleware/security.middleware';

const router = Router();
const universityRecs = new UniversityRecommendationService();

/**
 * GET /api/recommendations/universities
 * University-level matches for the authenticated student — ranked, with a
 * transparent per-dimension breakdown. Computed live (cached 5 min).
 */
router.get('/universities', requireAuth, async (req: Request, res: Response) => {
  try {
    const studentId = req.authUser?.studentId;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const matches = await universityRecs.recommend(studentId);
    return res.json({ success: true, data: matches });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate recommendations',
    });
  }
});

router.post('/generate', requireAuth, recommendationController.generateRecommendations);
// Students can only read their own recommendations; admins can read anyone's.
router.get(
  '/:studentId',
  requireAuth,
  requireSelfOrAdmin('studentId'),
  recommendationController.getRecommendations
);

export default router;
