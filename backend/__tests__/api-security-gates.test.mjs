/**
 * Synthetic API tests used as merge gates with coverage (and optional Stryker)
 * on auth + admin + requireAuth. Human + AI-generated tests must keep these green.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

import { createApiApp, attachGlobalErrorHandler } from '../app.js';

let app;

beforeAll(() => {
  app = createApiApp();
  attachGlobalErrorHandler(app);
});

describe('GET /api/health', () => {
  it('returns 200 without credentials', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('shieldpay');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when email or password missing', async () => {
    await request(app).post('/api/auth/login').send({ email: 'a@b.c' }).expect(400);
    await request(app).post('/api/auth/login').send({ password: 'x' }).expect(400);
  });

  it('returns 401 for invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'merchant@demo.com', password: 'WrongPassword!' })
      .expect(401);
  });

  it('returns 200 and JWT for valid admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shieldpay.lab', password: 'ChangeMeAdmin123!' })
      .expect(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
  });

  it('returns 400 for register when fields missing', async () => {
    await request(app).post('/api/auth/register').send({ email: 'only@email.com' }).expect(400);
  });

  it('returns 400 for request-reset without email', async () => {
    await request(app).post('/api/auth/request-reset').send({}).expect(400);
  });
});

describe('GET /api/admin/stats (ARKO-LAB-03: JWT only)', () => {
  it('returns 401 without Authorization', async () => {
    await request(app).get('/api/admin/stats').expect(401);
  });

  it('returns 401 for malformed Bearer token', async () => {
    await request(app).get('/api/admin/stats').set('Authorization', 'Bearer not-a-jwt').expect(401);
  });

  it('returns 200 with valid admin Bearer token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shieldpay.lab', password: 'ChangeMeAdmin123!' })
      .expect(200);
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(res.body).toHaveProperty('merchants');
    expect(res.body).toHaveProperty('transactions');
  });

  it('GET /api/admin/merchants returns rows for admin JWT', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shieldpay.lab', password: 'ChangeMeAdmin123!' })
      .expect(200);
    const res = await request(app)
      .get('/api/admin/merchants')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(Array.isArray(res.body.merchants)).toBe(true);
  });
});
