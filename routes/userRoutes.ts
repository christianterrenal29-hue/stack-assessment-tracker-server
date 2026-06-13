import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleCheck } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Admin-only routes
router.get('/', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await UserController.getAllUsers(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await UserController.createUser(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/bulk', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await UserController.bulkCreateUsers(req, res);
  } catch (error) {
    next(error);
  }
});

// Search users (accessible to instructors and administrators)
router.get('/search', roleCheck(['administrator', 'instructor']), async (req, res, next) => {
  try {
    await UserController.searchUsers(req, res);
  } catch (error) {
    next(error);
  }
});

// Get users by role (administrators and coordinators need assessor assignment lists)
router.get('/role/:role', roleCheck(['administrator', 'instructor']), async (req, res, next) => {
  try {
    await UserController.getUsersByRole(req, res);
  } catch (error) {
    next(error);
  }
});

// Get users by institution (administrators and instructors)
router.get('/institution/:institutionId', roleCheck(['administrator', 'instructor']), async (req, res, next) => {
  try {
    await UserController.getUsersByInstitution(req, res);
  } catch (error) {
    next(error);
  }
});

// Current authenticated user's profile
router.get('/profile', async (req, res, next) => {
  try {
    await UserController.getCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    await UserController.updateCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Get specific user (anyone can view their own, admin can view any)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Allow users to view their own profile or admins to view any
    if (req.user?.userId !== id && req.user?.role !== 'administrator') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    await UserController.getUserById(req, res);
  } catch (error) {
    next(error);
  }
});

// Update user (admin or self)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user?.userId !== id && req.user?.role !== 'administrator') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    await UserController.updateUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', roleCheck(['administrator']), async (req, res, next) => {
  try {
    await UserController.deleteUser(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
