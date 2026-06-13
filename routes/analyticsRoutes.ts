import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import analyticsService from '../services/analyticsService';

const router = Router();

// Dashboard analytics
router.get('/dashboard', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Attendance analytics
router.get('/attendance', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getAttendanceAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assessment analytics
router.get('/assessment', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getAssessmentAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Performance trends
router.get('/trends', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getStudentPerformanceTrends(days);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cohort progress
router.get('/cohort/progress', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getCohortProgressReport(req.query.qualification as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Risk factor analysis
router.get('/risk-factors', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getRiskFactorAnalysis();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Success metrics
router.get('/success-metrics', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getSuccessMetrics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Instructor effectiveness
router.get('/instructor/:instructorId', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getInstructorMetrics(String(req.params.instructorId));
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Compliance report
router.get('/compliance', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    const data = await analyticsService.getComplianceReport();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
