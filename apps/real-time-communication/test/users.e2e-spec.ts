import * as request from 'supertest';

import { USERS, seedUsers } from './fixtures/users.fixture';
import {
  createTestApp,
  resetAndSeed,
  TestContext,
} from './helpers/test-setup.helper';

describe('Users (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => resetAndSeed(ctx));

  describe('Authentication', () => {
    it('should accept valid API key in header', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);
    });

    it('should accept valid API key in cookie', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('Cookie', `apiKey=${USERS.BOB.apiKey}`)
        .expect(200);
    });

    it('should reject invalid API key', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('x-api-key', 'invalid-api-key')
        .expect(401);
    });

    it.each([
      ['GET /api/users', 'get', '/api/users'],
      ['GET /api/users/:id', 'get', `/api/users/${USERS.ALICE.id}`],
    ])('%s should require authentication', (_, method, path) => {
      return (request(ctx.app.getHttpServer()) as any)
        [method](path)
        .expect(401);
    });
  });

  describe('find all: GET /api/users', () => {
    it('should list all users', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(seedUsers.length);

      // Verify all seeded users are returned
      const returnedIds = res.body.map((u: any) => u.id);
      seedUsers.forEach((user) => {
        expect(returnedIds).toContain(user.id);
      });
    });

    it('should NOT expose apiKey in response', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      res.body.forEach((user: any) => {
        expect(user.apiKey).toBeUndefined();
      });
    });
  });

  describe('find one: GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/users/${USERS.ALICE.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.id).toBe(USERS.ALICE.id);
      expect(res.body.name).toBe(USERS.ALICE.name);
    });

    it('should NOT expose apiKey in response', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/users/${USERS.ALICE.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.apiKey).toBeUndefined();
    });

    it('should return 404 for non-existent user', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/users/non-existent-id')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(404);
    });
  });
});
