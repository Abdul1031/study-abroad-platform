import { Router, Request, Response } from 'express';
import { healthController } from '../controllers/healthController';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  healthController.check(req, res);
});

export default router;
