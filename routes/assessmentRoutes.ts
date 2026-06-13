import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authMiddleware, roleCheck } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary/dashboard', async (req, res, next) => {
  try {
    await AssessmentController.getDashboardSummary(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/:type', roleCheck(['administrator', 'instructor', 'assessor']), async (req, res, next) => {
  try {
    await AssessmentController.getReport(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    await AssessmentController.searchAssessments(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await AssessmentController.getAllAssessments(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.createAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await AssessmentController.getAssessmentById(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.updateAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.deleteAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/candidates', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.addCandidate(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/candidates/:studentId', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.removeCandidate(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/candidates/:studentId', roleCheck(['instructor', 'administrator', 'assessor']), async (req, res, next) => {
  try {
    await AssessmentController.updateCandidate(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
