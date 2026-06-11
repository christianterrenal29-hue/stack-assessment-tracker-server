import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import certificateService from '../services/certificateService';

const router = Router();

router.post('/', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await certificateService.issueCertificate(req.body);
    res.status(201).json(certificate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await certificateService.getAllCertificates(req.query);
    res.json(certificates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await certificateService.getStudentCertificates(String(req.params.studentId));
    res.json(certificates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify/:code', async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await certificateService.verifyCertificate(String(req.params.code));
    if (!certificate) return res.status(404).json({ error: 'Invalid verification code' });
    res.json(certificate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await certificateService.getCertificateById(String(req.params.id));
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/revoke', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await certificateService.revokeCertificate(String(req.params.id), req.body.reason);
    res.json(certificate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    await certificateService.deleteCertificate(String(req.params.id));
    res.json({ message: 'Certificate deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
