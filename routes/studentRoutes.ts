import { Router, Response } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import studentService, {
  CreateStudentInput,
  validateCourse,
  validateYearLevel,
  StudentFilters,
  UpdateStudentInput,
} from '../services/studentService';

const router = Router();

interface StudentIdParams extends ParamsDictionary {
  id: string;
}

interface StudentQuery extends Query {
  status?: string;
  riskLevel?: string;
  course?: string;
  yearLevel?: string;
  search?: string;
}

const STUDENT_STATUSES = ['active', 'inactive', 'graduated', 'dropped'] as const;
const RISK_LEVELS = ['low', 'medium', 'high'] as const;

const isStudentStatus = (value: string): value is NonNullable<StudentFilters['status']> => {
  return STUDENT_STATUSES.some((status) => status === value);
};

const isRiskLevel = (value: string): value is NonNullable<StudentFilters['riskLevel']> => {
  return RISK_LEVELS.some((riskLevel) => riskLevel === value);
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unexpected error';
};

const safeCourse = (value?: string): StudentFilters['course'] | undefined => {
  if (!value) return undefined;
  return validateCourse(value);
};

const safeYearLevel = (value?: string): StudentFilters['yearLevel'] | undefined => {
  if (!value) return undefined;
  return validateYearLevel(value);
};

// Create student
router.post<{}, unknown, CreateStudentInput & { userId: string }>(
  '/',
  authMiddleware,
  roleCheck(['administrator']),
  async (req: AuthRequest<{}, unknown, CreateStudentInput & { userId: string }>, res: Response) => {
  try {
    const student = await studentService.createStudent(req.body.userId, req.body);
    res.status(201).json(student);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
  }
);

// Get all students
router.get<{}, unknown, unknown, StudentQuery>(
  '/',
  authMiddleware,
  roleCheck(['administrator', 'instructor', 'assessor']),
  async (req: AuthRequest<{}, unknown, unknown, StudentQuery>, res: Response) => {
  try {
    const filters: StudentFilters = {
      status: req.query.status && isStudentStatus(req.query.status) ? req.query.status : undefined,
      riskLevel: req.query.riskLevel && isRiskLevel(req.query.riskLevel) ? req.query.riskLevel : undefined,
      course: safeCourse(req.query.course),
      yearLevel: safeYearLevel(req.query.yearLevel),
      search: req.query.search,
    };
    const students = await studentService.getAllStudents(filters);
    res.json(students);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
  }
);

// Get current user's student record
router.get('/user/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', statusCode: 401, message: 'Not authenticated' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', statusCode: 403, message: 'Student profile is only available for student users' });
    }

    const profile = await studentService.getCurrentStudentProfile(req.user);
    res.json({ status: 'success', data: profile });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get current user's progress
router.get('/me/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await studentService.getStudentProgressByUserId(req.user?.userId!);
    res.json({ status: 'success', data: progress });
  } catch (error: unknown) {
    res.status(404).json({ status: 'error', message: getErrorMessage(error) });
  }
});

// Get at-risk students
router.get('/risk/dashboard', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest, res: Response) => {
  try {
    const students = await studentService.getAtRiskStudents();
    res.json(students);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get student progress by student record ID
router.get<StudentIdParams>('/:id/progress', authMiddleware, async (req: AuthRequest<StudentIdParams>, res: Response) => {
  try {
    const progress = await studentService.getStudentProgress(String(req.params.id));
    res.json({ status: 'success', data: progress });
  } catch (error: unknown) {
    res.status(404).json({ status: 'error', message: getErrorMessage(error) });
  }
});

// Get student by ID
router.get<StudentIdParams>('/:id', authMiddleware, async (req: AuthRequest<StudentIdParams>, res: Response) => {
  try {
    const student = await studentService.getStudentById(String(req.params.id));
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update student
router.put<StudentIdParams, unknown, UpdateStudentInput>('/:id', authMiddleware, roleCheck(['administrator', 'instructor']), async (req: AuthRequest<StudentIdParams, unknown, UpdateStudentInput>, res: Response) => {
  try {
    const student = await studentService.updateStudent(String(req.params.id), req.body);
    res.json(student);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete student
router.delete<StudentIdParams>('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest<StudentIdParams>, res: Response) => {
  try {
    await studentService.deleteStudent(String(req.params.id));
    res.json({ message: 'Student deleted' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
