import { Router } from 'express';
import { QuestionController } from '../controllers/questionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get questions by assessment
router.get('/assessment/:assessmentId', async (req, res, next) => {
  try {
    await QuestionController.getQuestionsByAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Create question (educators and admins)
router.post('/', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await QuestionController.createQuestion(req, res);
  } catch (error) {
    next(error);
  }
});

// Bulk create questions for an assessment (educators and admins)
router.post('/assessment/:assessmentId/bulk', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await QuestionController.bulkCreateQuestions(req, res);
  } catch (error) {
    next(error);
  }
});

// Reorder questions in assessment (educators and admins)
router.put('/assessment/:assessmentId/reorder', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await QuestionController.reorderQuestions(req, res);
  } catch (error) {
    next(error);
  }
});

// Get questions by type
router.get('/assessment/:assessmentId/type/:type', async (req, res, next) => {
  try {
    await QuestionController.getQuestionsByType(req, res);
  } catch (error) {
    next(error);
  }
});

// Get specific question
router.get('/:id', async (req, res, next) => {
  try {
    await QuestionController.getQuestionById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update question (educators and admins)
router.put('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await QuestionController.updateQuestion(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete question (educators and admins)
router.delete('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await QuestionController.deleteQuestion(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
