import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe('API smoke tests', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Server is running');
    expect(['connected', 'disconnected']).toContain(response.body.database);
  });

  it('validates missing register fields before database work', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Missing required fields');
  });

  it('validates missing login fields before database work', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required');
  });

  it('protects profile without a token', async () => {
    const profile = await request(app).get('/api/auth/profile');

    expect(profile.status).toBe(401);
    expect(profile.body.message).toBe('No token provided');
  });

  it('logs out idempotently and clears the auth cookie', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      message: 'Logged out successfully',
    });
    expect(response.headers['set-cookie']?.join(';')).toContain('token=');
  });
});

describe('Protected module route guards', () => {
  const guardedCrudEndpoints = [
    ['users', '/api/users'],
    ['institutions', '/api/institutions'],
    ['departments', '/api/departments'],
    ['students', '/api/students'],
    ['assessments', '/api/assessments'],
    ['submissions', '/api/submissions'],
    ['attendance', '/api/attendance/me'],
    ['competencies', '/api/competencies'],
    ['qualifications', '/api/qualifications'],
    ['documents', '/api/files'],
    ['audit logs', '/api/audit-logs'],
    ['notifications', '/api/notifications'],
  ] as const;

  it.each(guardedCrudEndpoints)('protects %s list endpoint', async (_name, path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  it('does not expose the disabled ojt endpoint', async () => {
    const response = await request(app).get('/api/ojt');

    expect(response.status).toBe(404);
  });
});
