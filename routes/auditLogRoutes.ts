import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import auditLogService from '../services/auditLogService';

const router = Router();

router.get('/', authMiddleware, roleCheck(['administrator']), async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await auditLogService.getAll();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load audit logs' });
  }
});

export default router;
