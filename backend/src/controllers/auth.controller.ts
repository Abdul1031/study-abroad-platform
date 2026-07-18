import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { SignupSchema, LoginSchema } from '../domain/auth/auth.types';
import { prisma } from '../config/prisma';
import {
  REFRESH_COOKIE,
  refreshCookieOptions,
  resolveRoleForEmail,
} from '../middleware/security.middleware';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const validatedData = SignupSchema.parse(req.body);
      const result = await authService.signup(
        validatedData.email,
        validatedData.password,
        validatedData.fullName,
        validatedData.country
      );

      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);

      return res.status(201).json({
        success: true,
        accessToken: result.accessToken,
        student: { ...result.student, role: resolveRoleForEmail(result.student.email) },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await authService.login(validatedData.email, validatedData.password);

      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);

      return res.json({
        success: true,
        accessToken: result.accessToken,
        student: { ...result.student, role: resolveRoleForEmail(result.student.email) },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(401).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // NOTE: /refresh is handled by refreshSessionHandler (security.middleware.ts),
  // which rotates the token and detects replayed/stolen tokens.

  async logout(req: Request, res: Response) {
    try {
      const studentId = req.user?.studentId;
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      if (studentId && refreshToken) {
        await authService.logout(studentId, refreshToken);
      }

      res.clearCookie(REFRESH_COOKIE, { path: refreshCookieOptions.path });
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { password: _, ...studentWithoutPassword } = student;

      return res.json({
        success: true,
        student: { ...studentWithoutPassword, role: resolveRoleForEmail(student.email) },
      });
    } catch (error: unknown) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  }
}
