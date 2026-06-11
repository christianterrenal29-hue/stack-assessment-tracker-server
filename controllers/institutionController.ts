import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { InstitutionService } from '../services/institutionService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class InstitutionController {
  static async getAllInstitutions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const institutions = await InstitutionService.getAllInstitutions();

      res.status(200).json({
        status: 'success',
        data: institutions,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getInstitutionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Institution ID');

      const institution = await InstitutionService.getInstitutionById(safeId);

      res.status(200).json({
        status: 'success',
        data: institution,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createInstitution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, code, address, phone, email, logo } = req.body;

      if (!name || !code) {
        throw new AppError(400, 'Name and code are required');
      }

      const institution = await InstitutionService.createInstitution({
        name,
        code,
        address,
        phone,
        email,
        logo,
      });

      res.status(201).json({
        status: 'success',
        data: institution,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateInstitution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Institution ID');
      const updateData = req.body;

      const institution = await InstitutionService.updateInstitution(safeId, updateData);

      res.status(200).json({
        status: 'success',
        data: institution,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteInstitution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Institution ID');

      await InstitutionService.deleteInstitution(safeId);

      res.status(200).json({
        status: 'success',
        message: 'Institution deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async searchInstitutions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError(400, 'Search query required');
      }

      const institutions = await InstitutionService.searchInstitutions(q);

      res.status(200).json({
        status: 'success',
        data: institutions,
      });
    } catch (error) {
      throw error;
    }
  }
}
