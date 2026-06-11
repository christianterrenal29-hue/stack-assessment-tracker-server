import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AssessmentService } from '../services/assessmentService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class AssessmentController {
  static async getAllAssessments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        educator: req.query.educator,
        department: req.query.department,
        status: req.query.status,
        institution: req.query.institution,
      };

      const assessments = await AssessmentService.getAllAssessments(filters);

      res.status(200).json({
        status: 'success',
        data: assessments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Assessment ID');

      const assessment = await AssessmentService.getAssessmentById(safeId);

      res.status(200).json({
        status: 'success',
        data: assessment,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, description, type, department, institution, duration, totalPoints } = req.body;

      if (!title || !type || !institution) {
        throw new AppError(400, 'Title, type, and institution are required');
      }

      const assessment = await AssessmentService.createAssessment({
        title,
        description,
        type,
        educator: req.user?.userId,
        department,
        institution,
        duration,
        totalPoints,
      });

      res.status(201).json({
        status: 'success',
        data: assessment,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Assessment ID');
      const { title, description, duration, totalPoints, status } = req.body;

      const assessment = await AssessmentService.updateAssessment(safeId, {
        title,
        description,
        duration,
        totalPoints,
        status,
      });

      res.status(200).json({
        status: 'success',
        data: assessment,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Assessment ID');

      await AssessmentService.deleteAssessment(safeId);

      res.status(200).json({
        status: 'success',
        message: 'Assessment deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async publishAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Assessment ID');

      const assessment = await AssessmentService.publishAssessment(safeId);

      res.status(200).json({
        status: 'success',
        data: assessment,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentsByEducator(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { educatorId } = req.params;
      const safeEducatorId = safeParamString(educatorId, 'Educator ID');

      const assessments = await AssessmentService.getAssessmentsByEducator(safeEducatorId);

      res.status(200).json({
        status: 'success',
        data: assessments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentsByDepartment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const safeDepartmentId = safeParamString(departmentId, 'Department ID');

      const assessments = await AssessmentService.getAssessmentsByDepartment(safeDepartmentId);

      res.status(200).json({
        status: 'success',
        data: assessments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async searchAssessments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError(400, 'Search query required');
      }

      const assessments = await AssessmentService.searchAssessments(q);

      res.status(200).json({
        status: 'success',
        data: assessments,
      });
    } catch (error) {
      throw error;
    }
  }

  static async duplicateAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Assessment ID');
      const { newTitle } = req.body;

      if (!newTitle) {
        throw new AppError(400, 'New title is required');
      }

      const assessment = await AssessmentService.duplicateAssessment(safeId, newTitle);

      res.status(201).json({
        status: 'success',
        data: assessment,
      });
    } catch (error) {
      throw error;
    }
  }
}
