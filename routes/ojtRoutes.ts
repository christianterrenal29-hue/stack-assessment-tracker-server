import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import ojtService from '../services/ojtService';
import Student from '../models/Student';

const router = Router();

router.post('/', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const ojt = await ojtService.createOJT(req.body);
    res.status(201).json(ojt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await ojtService.getAllOJTRecords(req.query);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.userId });
    if (!student) return res.status(404).json({ error: 'Student record not found' });
    const ojt = await ojtService.getStudentOJT(String(student._id));
    if (!ojt) return res.status(404).json({ error: 'OJT record not found' });
    res.json(ojt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ojt = await ojtService.getStudentOJT(String(req.params.studentId));
    if (!ojt) return res.status(404).json({ error: 'OJT record not found' });
    res.json(ojt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ojt = await ojtService.getOJTById(String(req.params.id));
    if (!ojt) return res.status(404).json({ error: 'OJT record not found' });
    res.json(ojt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await ojtService.getOJTProgress(String(req.params.id));
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, roleCheck(['instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const ojt = await ojtService.updateOJTRecord(String(req.params.id), req.body);
    res.json(ojt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/complete', authMiddleware, roleCheck(['instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const ojt = await ojtService.completeOJT(String(req.params.id), req.body.finalReport);
    res.json(ojt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    await ojtService.deleteOJTRecord(String(req.params.id));
    res.json({ message: 'OJT record deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
