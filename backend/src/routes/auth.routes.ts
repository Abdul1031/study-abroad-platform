import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter, refreshSessionHandler } from '../middleware/security.middleware';

const router = Router();
const authController = new AuthController();

router.post('/signup', authRateLimiter, authController.signup.bind(authController));
router.post('/login', authRateLimiter, authController.login.bind(authController));
// Refresh Token Rotation: consumes the presented token, detects replays,
// and revokes every session on reuse (see security.middleware.ts).
router.post('/refresh', authRateLimiter, refreshSessionHandler);
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

export default router;
