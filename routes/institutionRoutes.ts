import { Router } from 'express';
import { InstitutionController } from '../controllers/institutionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all institutions (accessible to all authenticated users)
router.get('/', async (req, res, next) => {
  try {
    await InstitutionController.getAllInstitutions(req, res);
  } catch (error) {
    next(error);
  }
});

// Create institution (admin only)
router.post('/', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await InstitutionController.createInstitution(req, res);
  } catch (error) {
    next(error);
  }
});

// Search institutions (accessible to all authenticated users)
router.get('/search', async (req, res, next) => {
  try {
    await InstitutionController.searchInstitutions(req, res);
  } catch (error) {
    next(error);
  }
});

// Get institution by ID (accessible to all authenticated users)
router.get('/:id', async (req, res, next) => {
  try {
    await InstitutionController.getInstitutionById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update institution (admin only)
router.put('/:id', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await InstitutionController.updateInstitution(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete institution (admin only)
router.delete('/:id', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await InstitutionController.deleteInstitution(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
