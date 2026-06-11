import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { RubricService } from '../services/rubricService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class RubricController {
  static async getAllRubrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        assessment: req.query.assessment,
        educator: req.query.educator,
      };

      const rubrics = await RubricService.getAllRubrics(filters);

      res.status(200).json({
        status: 'success',
        data: rubrics,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getRubricById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Rubric ID');

      const rubric = await RubricService.getRubricById(safeId);

      res.status(200).json({
        status: 'success',
        data: rubric,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createRubric(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, assessment, criteria } = req.body;

      if (!name || !assessment || !criteria) {
        throw new AppError(400, 'Name, assessment, and criteria are required');
      }

      const rubric = await RubricService.createRubric({
        name,
        description,
        assessment,
        educator: req.user?.userId,
        criteria,
      });

      res.status(201).json({
        status: 'success',
        data: rubric,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateRubric(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Rubric ID');
      const { name, description, criteria } = req.body;

      const rubric = await RubricService.updateRubric(safeId, {
        name,
        description,
        criteria,
      });

      res.status(200).json({
        status: 'success',
        data: rubric,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteRubric(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Rubric ID');

      await RubricService.deleteRubric(safeId);

      res.status(200).json({
        status: 'success',
        message: 'Rubric deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async getRubricsByAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const safeAssessmentId = safeParamString(assessmentId, 'Assessment ID');

      const rubrics = await RubricService.getRubricsByAssessment(safeAssessmentId);

      res.status(200).json({
        status: 'success',
        data: rubrics,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getRubricsByEducator(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { educatorId } = req.params;
      const safeEducatorId = safeParamString(educatorId, 'Educator ID');

      const rubrics = await RubricService.getRubricsByEducator(safeEducatorId);

      res.status(200).json({
        status: 'success',
        data: rubrics,
      });
    } catch (error) {
      throw error;
    }
  }

  static async addCriterion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Rubric ID');
      const { name, description, levels } = req.body;

      if (!name || !levels) {
        throw new AppError(400, 'Name and levels are required');
      }

      const rubric = await RubricService.addCriterion(safeId, {
        name,
        description,
        levels,
      });

      res.status(200).json({
        status: 'success',
        data: rubric,
      });
    } catch (error) {
      throw error;
    }
  }

  static async removeCriterion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Rubric ID');
      const { criterionIndex } = req.body;

      if (criterionIndex === undefined) {
        throw new AppError(400, 'Criterion index is required');
      }

      const rubric = await RubricService.removeCriterion(safeId, criterionIndex);

      res.status(200).json({
        status: 'success',
        data: rubric,
      });
    } catch (error) {
      throw error;
    }
  }
}
