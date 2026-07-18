import { Router } from 'express';
import * as courseController from '../controllers/course.controller';

const router = Router();

router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);

export default router;
