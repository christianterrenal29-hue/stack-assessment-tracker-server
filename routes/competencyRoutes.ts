import { Router, Response } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import competencyService from '../services/competencyService';

const router = Router();

interface CompetencyIdParams extends ParamsDictionary {
  id: string;
}

interface CompetencyRequestBody {
  code: string;
  title: string;
  description?: string;
  qualification: string;
  assessmentCriteria?: string[];
  passingScore?: number;
}

interface CompetencyQuery extends Query {
  qualification?: string;
  search?: string;
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unexpected error';
};

router.post<{}, unknown, CompetencyRequestBody>(
  '/',
  authMiddleware,
  roleCheck(['administrator', 'instructor']),
  async (req: AuthRequest<{}, unknown, CompetencyRequestBody>, res: Response) => {
    try {
      const competency = await competencyService.createCompetency(req.body, req.user?.userId!);
      res.status(201).json(competency);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

router.get<{}, unknown, unknown, CompetencyQuery>(
  '/',
  authMiddleware,
  async (req: AuthRequest<{}, unknown, unknown, CompetencyQuery>, res: Response) => {
    try {
      const competencies = await competencyService.getAllCompetencies(req.query);
      res.json(competencies);
    } catch (error: unknown) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }
);

router.get<CompetencyIdParams>('/:id', authMiddleware, async (req: AuthRequest<CompetencyIdParams>, res: Response) => {
  try {
    const competency = await competencyService.getCompetencyById(String(req.params.id));
    if (!competency) return res.status(404).json({ error: 'Competency not found' });
    res.json(competency);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.put<CompetencyIdParams, unknown, Partial<CompetencyRequestBody>>(
  '/:id',
  authMiddleware,
  roleCheck(['administrator', 'instructor']),
  async (req: AuthRequest<CompetencyIdParams, unknown, Partial<CompetencyRequestBody>>, res: Response) => {
    try {
      const competency = await competencyService.updateCompetency(String(req.params.id), req.body);
      res.json(competency);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

router.delete<CompetencyIdParams>('/:id', authMiddleware, roleCheck(['administrator']), async (req: AuthRequest<CompetencyIdParams>, res: Response) => {
  try {
    await competencyService.deleteCompetency(String(req.params.id));
    res.json({ message: 'Competency deleted' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
