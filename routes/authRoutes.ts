import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await AuthController.logout(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    await AuthController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
