import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import courseService from '../services/courseService';

const router = Router();

router.post('/', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const courses = await courseService.getAllCourses(req.query);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const course = await courseService.getCourseById(String(req.params.id));
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const course = await courseService.updateCourse(String(req.params.id), req.body);
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/enroll', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const course = await courseService.enrollStudent(String(req.params.id), req.body.studentId);
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest, res: Response) => {
  try {
    await courseService.deleteCourse(String(req.params.id));
    res.json({ message: 'Course deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
