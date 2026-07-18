import { Router } from 'express';
import * as universityController from '../controllers/university.controller';

const router = Router();

router.get('/', universityController.listUniversities);
router.get('/search', universityController.searchUniversities);
router.get('/:id', universityController.getUniversity);
router.get('/:id/courses', universityController.getUniversityCourses);

export default router;
