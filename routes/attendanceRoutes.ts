import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import attendanceService from '../services/attendanceService';
import Student from '../models/Student';

const router = Router();

router.post('/', authMiddleware, roleCheck(['instructor']), async (req: AuthRequest, res: Response) => {
  try {
    req.body.recordedBy = req.user?.userId;
    const attendance = await attendanceService.recordAttendance(req.body);
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.userId });
    if (!student) return res.status(404).json({ error: 'Student record not found' });
    const records = await attendanceService.getStudentAttendanceRecords(String(student._id), req.query);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.userId });
    if (!student) return res.status(404).json({ error: 'Student record not found' });
    const stats = await attendanceService.getStudentAttendanceStats(String(student._id));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await attendanceService.getStudentAttendanceRecords(String(req.params.studentId), req.query);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await attendanceService.getStudentAttendanceStats(String(req.params.studentId));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const record = await attendanceService.getAttendanceById(String(req.params.id));
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, roleCheck(['instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const record = await attendanceService.updateAttendanceRecord(String(req.params.id), req.body);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleCheck(['instructor']), async (req: AuthRequest, res: Response) => {
  try {
    await attendanceService.deleteAttendanceRecord(String(req.params.id));
    res.json({ message: 'Attendance record deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
