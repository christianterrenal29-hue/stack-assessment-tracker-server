import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DepartmentService } from '../services/departmentService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class DepartmentController {
  static async getAllDepartments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        institution: req.query.institution,
      };

      const departments = await DepartmentService.getAllDepartments(filters);

      res.status(200).json({
        status: 'success',
        data: departments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getDepartmentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Department ID');

      const department = await DepartmentService.getDepartmentById(safeId);

      res.status(200).json({
        status: 'success',
        data: department,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createDepartment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, code, institution, head } = req.body;

      if (!name || !code || !institution) {
        throw new AppError(400, 'Name, code, and institution are required');
      }

      const department = await DepartmentService.createDepartment({
        name,
        code,
        institution,
        head,
      });

      res.status(201).json({
        status: 'success',
        data: department,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateDepartment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Department ID');
      const updateData = req.body;

      const department = await DepartmentService.updateDepartment(safeId, updateData);

      res.status(200).json({
        status: 'success',
        data: department,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteDepartment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Department ID');

      await DepartmentService.deleteDepartment(safeId);

      res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async getDepartmentsByInstitution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { institutionId } = req.params;
      const safeInstitutionId = safeParamString(institutionId, 'Institution ID');

      const departments = await DepartmentService.getDepartmentsByInstitution(safeInstitutionId);

      res.status(200).json({
        status: 'success',
        data: departments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async searchDepartments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError(400, 'Search query required');
      }

      const departments = await DepartmentService.searchDepartments(q);

      res.status(200).json({
        status: 'success',
        data: departments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async setDepartmentHead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Department ID');
      const { headId } = req.body;

      if (!headId) {
        throw new AppError(400, 'Head ID is required');
      }

      const department = await DepartmentService.setDepartmentHead(safeId, headId);

      res.status(200).json({
        status: 'success',
        data: department,
      });
    } catch (error) {
      throw error;
    }
  }
}
