import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { QuestionService } from '../services/questionService';
import { AppError } from '../middleware/errorHandler';
import { safeParamString } from '../utils/request';

export class QuestionController {
  static async getQuestionsByAssessment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const safeAssessmentId = safeParamString(assessmentId, 'Assessment ID');

      const questions = await QuestionService.getQuestionsByAssessment(safeAssessmentId);

      res.status(200).json({
        status: 'success',
        data: questions,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getQuestionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Question ID');

      const question = await QuestionService.getQuestionById(safeId);

      res.status(200).json({
        status: 'success',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessment, text, type, points, options, correctAnswer, rubric } = req.body;

      if (!assessment || !text || !type) {
        throw new AppError(400, 'Assessment, text, and type are required');
      }

      const question = await QuestionService.createQuestion({
        assessment,
        text,
        type,
        points,
        options,
        correctAnswer,
        rubric,
      });

      res.status(201).json({
        status: 'success',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Question ID');
      const { text, type, points, options, correctAnswer, rubric } = req.body;

      const question = await QuestionService.updateQuestion(safeId, {
        text,
        type,
        points,
        options,
        correctAnswer,
        rubric,
      });

      res.status(200).json({
        status: 'success',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const safeId = safeParamString(id, 'Question ID');

      await QuestionService.deleteQuestion(safeId);

      res.status(200).json({
        status: 'success',
        message: 'Question deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async reorderQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const safeAssessmentId = safeParamString(assessmentId, 'Assessment ID');
      const { questionIds } = req.body;

      if (!Array.isArray(questionIds)) {
        throw new AppError(400, 'Question IDs must be an array');
      }

      await QuestionService.reorderQuestions(safeAssessmentId, questionIds);

      res.status(200).json({
        status: 'success',
        message: 'Questions reordered successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  static async bulkCreateQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const safeAssessmentId = safeParamString(assessmentId, 'Assessment ID');
      const { questions } = req.body;

      if (!Array.isArray(questions)) {
        throw new AppError(400, 'Questions must be an array');
      }

      const result = await QuestionService.bulkCreateQuestions(safeAssessmentId, questions);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getQuestionsByType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assessmentId, type } = req.params;
      const safeAssessmentId = safeParamString(assessmentId, 'Assessment ID');
      const safeType = safeParamString(type, 'Question type');

      const questions = await QuestionService.getQuestionsByType(safeAssessmentId, safeType);

      res.status(200).json({
        status: 'success',
        data: questions,
      });
    } catch (error) {
      throw error;
    }
  }
}
