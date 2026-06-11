import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SubmissionService } from '../services/submissionService';
import { AppError } from '../middleware/errorHandler';

export class SubmissionController {
  static async getAllSubmissions(req: AuthRequest, res: Response): Promise<void> {
    const submissions = await SubmissionService.getAllSubmissions();
    res.status(200).json({ status: 'success', data: submissions });
  }

  static async getSubmissionById(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    const submission = await SubmissionService.getSubmissionById(req.params.id);
    res.status(200).json({ status: 'success', data: submission });
  }

  static async createSubmission(req: AuthRequest, res: Response): Promise<void> {
    const submission = await SubmissionService.createSubmission(req.body);
    res.status(201).json({ status: 'success', data: submission });
  }

  static async gradeSubmission(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    if (!req.user?.userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const result = await SubmissionService.gradeSubmission(req.params.id, req.user.userId, req.body);
    res.status(200).json({ status: 'success', data: result });
  }
}
