import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';
import { authMiddleware, roleCheck } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', roleCheck(['administrator', 'instructor', 'assessor']), async (req, res, next) => {
  try {
    await SubmissionController.getAllSubmissions(req, res);
  } catch (error) {
    next(error);
  }
});

router.get<{ id: string }>('/:id', async (req, res, next) => {
  try {
    await SubmissionController.getSubmissionById(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/', roleCheck(['student', 'administrator', 'instructor']), async (req, res, next) => {
  try {
    await SubmissionController.createSubmission(req, res);
  } catch (error) {
    next(error);
  }
});

router.post<{ id: string }>('/:id/grade', roleCheck(['assessor', 'instructor', 'administrator']), async (req, res, next) => {
  try {
    await SubmissionController.gradeSubmission(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
