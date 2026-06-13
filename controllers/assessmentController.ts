import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AssessmentService } from '../services/assessmentService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class AssessmentController {
  static async getAllAssessments(req: AuthRequest, res: Response): Promise<void> {
    const assessments = await AssessmentService.getAllAssessments({
      assessor: req.query.assessor,
      course: req.query.course,
      yearLevel: req.query.yearLevel,
      department: req.query.department,
      status: req.query.status,
      institution: req.query.institution,
      from: req.query.from,
      to: req.query.to,
    });

    res.status(200).json({ status: 'success', data: assessments });
  }

  static async getAssessmentById(req: AuthRequest, res: Response): Promise<void> {
    const assessment = await AssessmentService.getAssessmentById(safeParamString(req.params.id, 'Assessment schedule ID'));
    res.status(200).json({ status: 'success', data: assessment });
  }

  static async createAssessment(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.userId) throw new AppError(401, 'Not authenticated');

    const assessment = await AssessmentService.createAssessment({
      ...req.body,
      createdBy: req.user.userId,
    });

    res.status(201).json({ status: 'success', data: assessment });
  }

  static async updateAssessment(req: AuthRequest, res: Response): Promise<void> {
    const assessment = await AssessmentService.updateAssessment(
      safeParamString(req.params.id, 'Assessment schedule ID'),
      req.body
    );

    res.status(200).json({ status: 'success', data: assessment });
  }

  static async deleteAssessment(req: AuthRequest, res: Response): Promise<void> {
    await AssessmentService.deleteAssessment(safeParamString(req.params.id, 'Assessment schedule ID'));
    res.status(200).json({ status: 'success', message: 'Assessment schedule deleted successfully' });
  }

  static async addCandidate(req: AuthRequest, res: Response): Promise<void> {
    const assessment = await AssessmentService.addCandidate(
      safeParamString(req.params.id, 'Assessment schedule ID'),
      req.body.studentId
    );

    res.status(200).json({ status: 'success', data: assessment });
  }

  static async removeCandidate(req: AuthRequest, res: Response): Promise<void> {
    const assessment = await AssessmentService.removeCandidate(
      safeParamString(req.params.id, 'Assessment schedule ID'),
      safeParamString(req.params.studentId, 'Student ID')
    );

    res.status(200).json({ status: 'success', data: assessment });
  }

  static async updateCandidate(req: AuthRequest, res: Response): Promise<void> {
    const assessment = await AssessmentService.updateCandidate(
      safeParamString(req.params.id, 'Assessment schedule ID'),
      safeParamString(req.params.studentId, 'Student ID'),
      req.body
    );

    res.status(200).json({ status: 'success', data: assessment });
  }

  static async searchAssessments(req: AuthRequest, res: Response): Promise<void> {
    const { q } = req.query;
    if (!q || typeof q !== 'string') throw new AppError(400, 'Search query required');

    const assessments = await AssessmentService.searchAssessments(q);
    res.status(200).json({ status: 'success', data: assessments });
  }

  static async getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
    const summary = await AssessmentService.getDashboardSummary();
    res.status(200).json({ status: 'success', data: summary });
  }

  static async getReport(req: AuthRequest, res: Response): Promise<void> {
    const report = await AssessmentService.getReport(safeParamString(req.params.type, 'Report type'));
    res.status(200).json({ status: 'success', data: report });
  }
}
