import { Router } from 'express';
import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/application.controller';
import { requireAuth } from '../middleware/security.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', listApplications);
router.post('/', createApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

export default router;
