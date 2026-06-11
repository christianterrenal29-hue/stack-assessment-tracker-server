import { Router } from 'express';
import { RubricController } from '../controllers/rubricController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all rubrics (with filters)
router.get('/', async (req, res, next) => {
  try {
    await RubricController.getAllRubrics(req, res);
  } catch (error) {
    next(error);
  }
});

// Create rubric (educators and admins)
router.post('/', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await RubricController.createRubric(req, res);
  } catch (error) {
    next(error);
  }
});

// Get rubrics by assessment
router.get('/assessment/:assessmentId', async (req, res, next) => {
  try {
    await RubricController.getRubricsByAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

// Get rubrics by educator
router.get('/educator/:educatorId', async (req, res, next) => {
  try {
    await RubricController.getRubricsByEducator(req, res);
  } catch (error) {
    next(error);
  }
});

// Get specific rubric
router.get('/:id', async (req, res, next) => {
  try {
    await RubricController.getRubricById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update rubric (educators and admins)
router.put('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await RubricController.updateRubric(req, res);
  } catch (error) {
    next(error);
  }
});

// Add criterion to rubric (educators and admins)
router.put('/:id/criteria', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await RubricController.addCriterion(req, res);
  } catch (error) {
    next(error);
  }
});

// Remove criterion from rubric (educators and admins)
router.put('/:id/criteria/remove', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await RubricController.removeCriterion(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete rubric (educators and admins)
router.delete('/:id', roleCheck(['instructor', 'administrator']), async (req, res, next) => {
  try {
    await RubricController.deleteRubric(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
