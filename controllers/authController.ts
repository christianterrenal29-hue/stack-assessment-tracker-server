import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, password, role, institution, department } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        throw new AppError(400, 'Missing required fields');
      }

      const result = await AuthService.register({
        firstName,
        lastName,
        email,
        password,
        role,
        institution,
        department,
      });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        status: 'success',
        data: { user: result.user },
      });
    } catch (error: any) {
      throw error;
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Email and password are required');
      }

      const result = await AuthService.login({ email, password });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: 'success',
        data: { user: result.user },
      });
    } catch (error: any) {
      throw error;
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('token');
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      throw error;
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const user = await AuthService.getUserById(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
