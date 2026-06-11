import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString, safeQueryString } from '../utils/request';

export class UserController {
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        role: safeQueryString(req.query.role),
        institution: safeQueryString(req.query.institution),
        isActive: safeQueryString(req.query.isActive) === 'true',
      };

      const users = await UserService.getAllUsers(filters);

      res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'User ID');

      const user = await UserService.getUserById(safeId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const user = await UserService.getUserById(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, password, role, institution, department } = req.body;

      if (!firstName || !lastName || !email || !password || !role) {
        throw new AppError(400, 'Missing required fields');
      }

      const user = await UserService.createUser({
        firstName,
        lastName,
        email,
        password,
        role,
        institution,
        department,
      });

      res.status(201).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'User ID');
      const updateData = req.body;

      const user = await UserService.updateUser(safeId, updateData);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const { firstName, lastName, email, phone, avatar } = req.body;
      const user = await UserService.updateUser(req.user.userId, {
        firstName,
        lastName,
        email,
        phone,
        avatar,
      });

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'User ID');

      await UserService.deleteUser(safeId);

      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async bulkCreateUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { users } = req.body;

      if (!Array.isArray(users)) {
        throw new AppError(400, 'Users must be an array');
      }

      const result = await UserService.bulkCreateUsers(users);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const safeQuery = safeQueryString(q);

      if (!safeQuery) {
        throw new AppError(400, 'Search query required');
      }

      const users = await UserService.searchUsers(safeQuery);

      res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getUsersByRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const safeRole = safeParamString(role, 'Role');

      const users = await UserService.getUsersByRole(safeRole);

      res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getUsersByInstitution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { institutionId } = req.params;
      const safeInstitutionId = safeParamString(institutionId, 'Institution ID');

      const users = await UserService.getUsersByInstitution(safeInstitutionId);

      res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      throw error;
    }
  }
}
