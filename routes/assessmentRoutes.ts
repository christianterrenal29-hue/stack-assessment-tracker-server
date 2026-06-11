import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all assessments (accessible to all authenticated users)
router.get('/', async (req, res, next) => {
  try {
    await AssessmentController.getAllAssessments(req, res);
  } catch (error) {
    next(error);
  }
});

// Create assessment (educators and admins)
router.post('/', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.createAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Search assessments (all authenticated users)
router.get('/search', async (req, res, next) => {
  try {
    await AssessmentController.searchAssessments(req, res);
  } catch (error) {
    next(error);
  }
});

// Get assessments by educator
router.get('/educator/:educatorId', async (req, res, next) => {
  try {
    await AssessmentController.getAssessmentsByEducator(req, res);
  } catch (error) {
    next(error);
  }
});

// Get assessments by department
router.get('/department/:departmentId', async (req, res, next) => {
  try {
    await AssessmentController.getAssessmentsByDepartment(req, res);
  } catch (error) {
    next(error);
  }
});

// Get specific assessment
router.get('/:id', async (req, res, next) => {
  try {
    await AssessmentController.getAssessmentById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update assessment (educator or admin)
router.put('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.updateAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Publish assessment (educator or admin)
router.put('/:id/publish', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.publishAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Duplicate assessment (educator or admin)
router.post('/:id/duplicate', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.duplicateAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete assessment (educator or admin)
router.delete('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await AssessmentController.deleteAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
