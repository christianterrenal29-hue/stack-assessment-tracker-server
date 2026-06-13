import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AssessmentService } from '../services/assessmentService';
import { Assessment } from '../models/Assessment';
import Student from '../models/Student';
import { User } from '../models/User';

jest.mock('../models/Assessment', () => ({
  MAX_CANDIDATES_PER_SCHEDULE: 10,
  Assessment: jest.fn().mockImplementation((data) => ({
    ...data,
    id: 'assessment-id',
    save: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../models/Student', () => ({
  __esModule: true,
  COURSE_OPTIONS: ['IT', 'HRMT', 'ECT', 'HST'],
  YEAR_LEVEL_OPTIONS: ['1st Year', '2nd Year', '3rd Year'],
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('../models/User', () => ({
  User: {
    findById: jest.fn(),
  },
}));

const mockAssessment = Assessment as unknown as jest.Mock & {
  findById: jest.Mock;
  findOne: jest.Mock;
};
const mockStudent = Student as unknown as { countDocuments: jest.Mock };
const mockUser = User as unknown as { findById: jest.Mock };

const objectId = (suffix: string) => `507f1f77bcf86cd7994390${suffix.padStart(2, '0')}`;

const baseSchedule = {
  title: 'Cookery NC II Assessment',
  course: 'HRMT',
  yearLevel: '2nd Year',
  qualificationTitle: 'Cookery',
  ncLevel: 'NC II',
  scheduleDateTime: '2026-07-01T08:00:00.000Z',
  assessmentCenter: 'TESDA Assessment Center A',
  assessor: objectId('01'),
  candidates: [objectId('02')],
  createdBy: objectId('03'),
};

describe('AssessmentService scheduling validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: baseSchedule.assessor,
        firstName: 'Ada',
        lastName: 'Assessor',
        role: 'assessor',
      }),
    });
    mockStudent.countDocuments.mockResolvedValue(1);
    mockAssessment.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockAssessment.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    });
  });

  it('rejects more than ten candidates', async () => {
    await expect(
      AssessmentService.createAssessment({
        ...baseSchedule,
        candidates: Array.from({ length: 11 }, (_, index) => objectId(String(index + 10))),
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Assessment schedule cannot exceed 10 candidates',
    });
  });

  it('rejects duplicate candidates during schedule creation', async () => {
    await expect(
      AssessmentService.createAssessment({
        ...baseSchedule,
        candidates: [objectId('02'), objectId('02')],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Duplicate candidates cannot be added to the same assessment schedule',
    });
  });

  it('rejects a non-assessor assignment', async () => {
    mockUser.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({ role: 'instructor' }),
    });

    await expect(AssessmentService.createAssessment(baseSchedule)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Assigned assessor must be an accredited assessor user',
    });
  });

  it('rejects assessor schedule conflicts', async () => {
    mockAssessment.findOne = jest.fn().mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({ _id: objectId('04') }),
    });

    await expect(AssessmentService.createAssessment(baseSchedule)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Assessor has a conflicting assessment schedule within 4 hours',
    });
  });

  it('updates candidate attendance and result fields', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const assessmentDoc = {
      candidates: [{ student: objectId('02'), attendanceStatus: 'pending', result: 'pending' }],
      save,
    };
    mockAssessment.findById
      .mockReturnValueOnce(Promise.resolve(assessmentDoc))
      .mockReturnValueOnce({ populate: jest.fn().mockReturnThis() });

    await AssessmentService.updateCandidate(objectId('05'), objectId('02'), {
      attendanceStatus: 'present',
      result: 'competent',
    });

    expect(assessmentDoc.candidates[0]).toMatchObject({
      attendanceStatus: 'present',
      result: 'competent',
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
