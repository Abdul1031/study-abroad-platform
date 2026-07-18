import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import {
  BCRYPT_SALT_ROUNDS,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
} from '../domain/auth/auth.constants';
import { AuthResponse } from '../domain/auth/auth.types';

export class AuthService {
  async signup(
    email: string,
    password: string,
    fullName: string,
    country?: string
  ): Promise<AuthResponse> {
    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const student = await prisma.student.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        country,
      },
    });

    const accessToken = this.generateAccessToken(student.id, student.email);
    const refreshToken = this.generateRefreshToken(student.id);

    await this.saveRefreshToken(student.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, student.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(student.id, student.email);
    const refreshToken = this.generateRefreshToken(student.id);

    await this.saveRefreshToken(student.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret') as any;
      const studentId = decoded.studentId;

      const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) throw new Error('User not found');

      const accessToken = this.generateAccessToken(student.id, student.email);
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(studentId: string, refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        studentId,
        token: refreshToken,
      },
    });
  }

  private generateAccessToken(studentId: string, email: string): string {
    return jwt.sign({ studentId, email }, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: JWT_ACCESS_EXPIRY,
    });
  }

  private generateRefreshToken(studentId: string): string {
    // jti keeps tokens unique even when issued within the same second —
    // required for Refresh Token Rotation reuse detection to work.
    return jwt.sign({ studentId }, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: JWT_REFRESH_EXPIRY,
      jwtid: crypto.randomUUID(),
    });
  }

  private async saveRefreshToken(studentId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        studentId,
        token,
        expiresAt,
      },
    });
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }
}
