import * as request from 'supertest';

import { COMMENTS, seedComments } from './fixtures/comments.fixture';
import { TASKS } from './fixtures/tasks.fixture';
import { USERS } from './fixtures/users.fixture';
import {
  createTestApp,
  resetAndSeed,
  TestContext,
} from './helpers/test-setup.helper';

describe('Comments (e2e)', () => {
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
        .get('/api/comments')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);
    });

    it('should accept valid API key in cookie', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/comments')
        .set('Cookie', `apiKey=${USERS.BOB.apiKey}`)
        .expect(200);
    });

    it('should reject invalid API key', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/comments')
        .set('x-api-key', 'invalid-api-key')
        .expect(401);
    });

    it.each([
      ['GET /api/comments', 'get', '/api/comments'],
      [
        'GET /api/comments/:id',
        'get',
        `/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`,
      ],
      ['POST /api/comments', 'post', '/api/comments'],
      [
        'PATCH /api/comments/:id',
        'patch',
        `/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`,
      ],
      [
        'DELETE /api/comments/:id',
        'delete',
        `/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`,
      ],
    ])('%s should require authentication', (_, method, path) => {
      return (request(ctx.app.getHttpServer()) as any)
        [method](path)
        .expect(401);
    });
  });

  describe('find all: GET /api/comments', () => {
    const nonDeletedComments = seedComments.filter((c) => !c.deletedAt);
    const deletedComments = seedComments.filter((c) => c.deletedAt);

    it('should return all non-deleted comments', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/comments')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(nonDeletedComments.length);

      // Verify all returned comments are non-deleted
      res.body.forEach((comment: any) => {
        expect(comment.deletedAt).toBeUndefined();
      });

      // Verify deleted comments are not present
      const deletedIds = deletedComments.map((c) => c.id);
      const returnedIds = res.body.map((c: any) => c.id);
      deletedIds.forEach((id) => {
        expect(returnedIds).not.toContain(id);
      });
    });

    it('should filter comments by taskId', async () => {
      const expectedComments = nonDeletedComments.filter(
        (c) => c.taskId === TASKS.IMPLEMENT_AUTH.id,
      );

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/comments?taskId=${TASKS.IMPLEMENT_AUTH.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(expectedComments.length);

      res.body.forEach((comment: any) => {
        expect(comment.taskId).toBe(TASKS.IMPLEMENT_AUTH.id);
      });
    });

    it('should include deleted comments when includeDeleted=true', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/comments?includeDeleted=true')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(seedComments.length);

      // Verify deleted comments are now present with deletedAt
      const deletedIds = deletedComments.map((c) => c.id);
      deletedIds.forEach((id) => {
        const comment = res.body.find((c: any) => c.id === id);
        expect(comment).toBeDefined();
        expect(comment.deletedAt).toBeDefined();
      });
    });

    it('should filter by changedSince', async () => {
      const cutoffDate = new Date('2025-12-15T00:00:00Z');
      const expectedComments = nonDeletedComments.filter(
        (c) => c.updatedAt > cutoffDate,
      );

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/comments?changedSince=${cutoffDate.toISOString()}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(expectedComments.length);

      res.body.forEach((comment: any) => {
        expect(new Date(comment.updatedAt).getTime()).toBeGreaterThan(
          cutoffDate.getTime(),
        );
      });
    });
  });

  describe('find one: GET /api/comments/:id', () => {
    it('should return a specific comment', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.id).toBe(COMMENTS.PROJECT_LOOKS_GOOD.id);
      expect(res.body.content).toBe(COMMENTS.PROJECT_LOOKS_GOOD.content);
    });

    it('should return 404 for non-existent comment', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/comments/non-existent-id')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(404);
    });
  });

  describe('create: POST /api/comments', () => {
    it('should create a new comment', async () => {
      const newComment = {
        taskId: TASKS.WRITE_TESTS.id,
        content: 'This is a test comment',
        authorId: USERS.ALICE.id,
      };

      const res = await request(ctx.app.getHttpServer())
        .post('/api/comments')
        .set('x-api-key', USERS.ALICE.apiKey)
        .send(newComment)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe(newComment.content);
      expect(res.body.taskId).toBe(newComment.taskId);
      expect(res.body.authorId).toBe(newComment.authorId);
      expect(res.body.createdAt).toBeDefined();
    });
  });

  describe('update: PATCH /api/comments/:id', () => {
    it('should update a comment', async () => {
      const update = { content: 'Updated comment content' };

      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.BOB.apiKey)
        .send(update)
        .expect(200);

      expect(res.body.content).toBe('Updated comment content');
    });

    it('should return 404 for deleted comment', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/api/comments/${COMMENTS.DELETED_AUTH_COMMENT.id}`)
        .set('x-api-key', USERS.CHARLIE.apiKey)
        .send({ content: 'Should Fail' })
        .expect(404);
    });
  });

  describe('delete: DELETE /api/comments/:id', () => {
    it('should allow author to delete their own comment', async () => {
      // COMMENTS.PROJECT_LOOKS_GOOD was created by BOB
      await request(ctx.app.getHttpServer())
        .delete(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.BOB.apiKey)
        .expect(200);
    });

    it('should reject deletion by non-author', async () => {
      // COMMENTS.PROJECT_LOOKS_GOOD was created by BOB, ALICE cannot delete it
      await request(ctx.app.getHttpServer())
        .delete(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(403);
    });

    it('should soft delete the comment', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.BOB.apiKey)
        .expect(200);

      // Should not appear in normal list
      const listRes = await request(ctx.app.getHttpServer())
        .get('/api/comments')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const deletedComment = listRes.body.find(
        (c: any) => c.id === COMMENTS.PROJECT_LOOKS_GOOD.id,
      );
      expect(deletedComment).toBeUndefined();

      // Should appear with includeDeleted=true
      const includeDeletedRes = await request(ctx.app.getHttpServer())
        .get('/api/comments?includeDeleted=true')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const foundComment = includeDeletedRes.body.find(
        (c: any) => c.id === COMMENTS.PROJECT_LOOKS_GOOD.id,
      );
      expect(foundComment).toBeDefined();
      expect(foundComment.deletedAt).toBeDefined();
    });

    it('should return 404 for already deleted comment', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/api/comments/${COMMENTS.DELETED_AUTH_COMMENT.id}`)
        .set('x-api-key', USERS.CHARLIE.apiKey)
        .expect(404);
    });
  });
});
