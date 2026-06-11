import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import riskMonitoringService from '../services/riskMonitoringService';

const router = Router();

// Get all at-risk students
router.get('/students/at-risk', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const threshold = (req.query.threshold as string) || 'high';
    const students = await riskMonitoringService.getAtRiskStudents(threshold as 'high' | 'medium' | 'all');
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get risk dashboard analytics
router.get('/analytics/dashboard', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await riskMonitoringService.generateRiskAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get student risk report
router.get('/student/:studentId/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await riskMonitoringService.getStudentRiskReport(String(req.params.studentId));
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations for student
router.get('/student/:studentId/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await riskMonitoringService.getRecommendationsForStudent(String(req.params.studentId));
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate risk level for student
router.post('/student/:studentId/assess', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const riskLevel = await riskMonitoringService.calculateStudentRiskLevel(String(req.params.studentId));
    res.json({ studentId: req.params.studentId, riskLevel });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
