import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import riskAssessmentScheduler from '../services/riskAssessmentScheduler';

const router = Router();

// Run batch risk assessment
router.post('/assess/batch', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const results = await riskAssessmentScheduler.runBatchRiskAssessment();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get students with changed risk levels
router.get('/changes/:timeframe', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const timeframe = (req.params.timeframe as 'today' | 'week' | 'month') || 'today';
    const students = await riskAssessmentScheduler.getChangedRiskStudents(timeframe);
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get high priority students needing intervention
router.get('/high-priority', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const students = await riskAssessmentScheduler.getHighPriorityStudents();
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get student trend
router.get('/trend/:studentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await riskAssessmentScheduler.getStudentTrend(String(req.params.studentId), days);
    res.json(trend);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate intervention plan
router.get('/intervention/:studentId', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const plan = await riskAssessmentScheduler.generateInterventionPlan(String(req.params.studentId));
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get cohort analytics
router.get('/cohort/analytics', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await riskAssessmentScheduler.getCohortAnalytics(req.query.qualification as string);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate at-risk report
router.get('/report/at-risk', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const report = await riskAssessmentScheduler.generateAtRiskReport();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
