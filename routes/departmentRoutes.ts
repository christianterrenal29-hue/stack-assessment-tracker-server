import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all departments (accessible to all authenticated users)
router.get('/', async (req, res, next) => {
  try {
    await DepartmentController.getAllDepartments(req, res);
  } catch (error) {
    next(error);
  }
});

// Create department (admin only)
router.post('/', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await DepartmentController.createDepartment(req, res);
  } catch (error) {
    next(error);
  }
});

// Search departments (accessible to all authenticated users)
router.get('/search', async (req, res, next) => {
  try {
    await DepartmentController.searchDepartments(req, res);
  } catch (error) {
    next(error);
  }
});

// Get departments by institution (accessible to all authenticated users)
router.get('/institution/:institutionId', async (req, res, next) => {
  try {
    await DepartmentController.getDepartmentsByInstitution(req, res);
  } catch (error) {
    next(error);
  }
});

// Get department by ID (accessible to all authenticated users)
router.get('/:id', async (req, res, next) => {
  try {
    await DepartmentController.getDepartmentById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update department (admin only)
router.put('/:id', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await DepartmentController.updateDepartment(req, res);
  } catch (error) {
    next(error);
  }
});

// Set department head (admin only)
router.put('/:id/head', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await DepartmentController.setDepartmentHead(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete department (admin only)
router.delete('/:id', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await DepartmentController.deleteDepartment(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
