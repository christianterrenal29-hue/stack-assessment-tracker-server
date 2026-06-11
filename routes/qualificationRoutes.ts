import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import qualificationService from '../services/qualificationService';

const router = Router();

router.post('/', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const qualification = await qualificationService.createQualification(req.body, req.user?.userId!);
    res.status(201).json(qualification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const qualifications = await qualificationService.getAllQualifications(req.query);
    res.json(qualifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const qualification = await qualificationService.getQualificationById(String(req.params.id));
    if (!qualification) return res.status(404).json({ error: 'Qualification not found' });
    res.json(qualification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const qualification = await qualificationService.updateQualification(String(req.params.id), req.body);
    res.json(qualification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/competencies', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const qualification = await qualificationService.addCompetency(String(req.params.id), req.body.competencyId);
    res.json(qualification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    await qualificationService.deleteQualification(String(req.params.id));
    res.json({ message: 'Qualification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
