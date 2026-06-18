import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import { generateToken } from '../utils/jwt';

const mockStudentService = {
  createStudent: jest.fn(),
  getAllStudents: jest.fn(),
  getStudentByUserId: jest.fn(),
  getCurrentStudentProfile: jest.fn(),
  getStudentProgressByUserId: jest.fn(),
  getAtRiskStudents: jest.fn(),
  getStudentProgress: jest.fn(),
  getStudentById: jest.fn(),
  updateStudent: jest.fn(),
  deleteStudent: jest.fn(),
};

jest.mock('../services/studentService', () => ({
  __esModule: true,
  default: mockStudentService,
  validateCourse: jest.fn((value: string) => value),
  validateYearLevel: jest.fn((value: string) => value),
}));

import app from '../app';

const studentUserId = '507f1f77bcf86cd799439011';
const instructorUserId = '507f1f77bcf86cd799439012';
const studentRecordId = '507f1f77bcf86cd799439013';

const authHeader = (token: string) => `Bearer ${token}`;

describe('GET /api/students/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows an authenticated student to fetch profile data', async () => {
    mockStudentService.getCurrentStudentProfile.mockResolvedValueOnce({
      user: {
        _id: studentUserId,
        firstName: 'Student',
        lastName: 'User',
        email: 'student@example.com',
        role: 'student',
      },
      student: {
        _id: studentRecordId,
        studentId: 'STU-001',
        course: 'IT',
        yearLevel: '1st Year',
      },
    });

    const token = generateToken({
      userId: studentUserId,
      email: 'student@example.com',
      role: 'student',
    });

    const response = await request(app)
      .get('/api/students/user/profile')
      .set('Authorization', authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        user: {
          _id: studentUserId,
          firstName: 'Student',
          lastName: 'User',
          email: 'student@example.com',
          role: 'student',
        },
        student: {
          _id: studentRecordId,
          studentId: 'STU-001',
          course: 'IT',
          yearLevel: '1st Year',
        },
      },
    });
  });

  it('returns a graceful profile when the student record does not exist yet', async () => {
    mockStudentService.getCurrentStudentProfile.mockResolvedValueOnce({
      user: {
        _id: studentUserId,
        email: 'student@example.com',
        role: 'student',
      },
      student: null,
    });

    const token = generateToken({
      userId: studentUserId,
      email: 'student@example.com',
      role: 'student',
    });

    const response = await request(app)
      .get('/api/students/user/profile')
      .set('Authorization', authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data.student).toBeNull();
  });

  it('forbids non-student users from the student profile route', async () => {
    const token = generateToken({
      userId: instructorUserId,
      email: 'instructor@example.com',
      role: 'instructor',
    });

    const response = await request(app)
      .get('/api/students/user/profile')
      .set('Authorization', authHeader(token));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Student profile is only available for student users');
    expect(mockStudentService.getCurrentStudentProfile).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/students/user/profile');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });
});
