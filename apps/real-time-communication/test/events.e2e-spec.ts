import * as request from 'supertest';

import { COMMENTS } from './fixtures/comments.fixture';
import { TASKS } from './fixtures/tasks.fixture';
import { USERS } from './fixtures/users.fixture';
import { createSseClient, SseClient } from './helpers/sse.helper';
import {
  createTestApp,
  resetAndSeed,
  TestContext,
} from './helpers/test-setup.helper';

describe('EventsController (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => resetAndSeed(ctx));

  describe('GET /api/events (SSE)', () => {
    it('should require authentication', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/events')
        .set('Accept', 'text/event-stream');

      expect(response.status).toBe(401);
    });

    it('should establish SSE connection with valid API key', async () => {
      const sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      try {
        expect(sse).toBeDefined();
      } finally {
        sse.close();
      }
    });
  });

  describe('SSE Heartbeat Events', () => {
    it('should receive heartbeat events', async () => {
      const sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      try {
        // Heartbeat is emitted every 3 seconds, wait up to 5 seconds
        const event = await sse.waitForEvent(
          (e) => e.type === 'heartbeat',
          5000,
        );

        expect(event).toMatchObject({
          type: 'heartbeat',
          timestamp: expect.any(Number),
        });
      } finally {
        sse.close();
      }
    });
  });

  describe('SSE Task Events', () => {
    let sse: SseClient;

    afterEach(() => {
      sse?.close();
    });

    it('should receive task:created event when task is created', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      const res = await request(ctx.app.getHttpServer())
        .post('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({
          title: 'SSE Test Task',
          description: 'Testing SSE events',
        })
        .expect(201);

      const event = await sse.waitForEvent(
        (e) =>
          e.type === 'created' &&
          e.domain === 'task' &&
          e.payload.id === res.body.id,
      );

      expect(event).toMatchObject({
        domain: 'task',
        type: 'created',
        payload: expect.objectContaining({ title: 'SSE Test Task' }),
      });
    });

    it('should receive task:updated event when task is updated', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ title: 'Updated Task Title' })
        .expect(200);

      const event = await sse.waitForEvent(
        (e) =>
          e.domain === 'task' &&
          e.type === 'updated' &&
          e.payload.id === TASKS.WRITE_TESTS.id,
      );

      expect(event).toMatchObject({
        domain: 'task',
        type: 'updated',
        payload: expect.objectContaining({ title: 'Updated Task Title' }),
      });
    });

    it('should receive task:deleted event when task is deleted', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      await request(ctx.app.getHttpServer())
        .delete(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const event = await sse.waitForEvent(
        (e) =>
          e.domain === 'task' &&
          e.type === 'deleted' &&
          e.payload.id === TASKS.WRITE_TESTS.id,
      );

      expect(event).toMatchObject({
        domain: 'task',
        type: 'deleted',
        payload: expect.objectContaining({ id: TASKS.WRITE_TESTS.id }),
      });
    });

    it('should receive task:updated event when task status is changed', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}/status`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ status: 'in-progress' })
        .expect(200);

      const event = await sse.waitForEvent(
        (e) =>
          e.domain === 'task' &&
          e.type === 'updated' &&
          e.payload.id === TASKS.WRITE_TESTS.id,
      );

      expect(event).toMatchObject({
        domain: 'task',
        type: 'updated',
        payload: expect.objectContaining({ status: 'in-progress' }),
      });
    });
  });

  describe('SSE Comment Events', () => {
    let sse: SseClient;

    afterEach(() => {
      sse?.close();
    });

    it('should receive comment:created event when comment is created', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      const res = await request(ctx.app.getHttpServer())
        .post('/api/comments')
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({
          taskId: TASKS.WRITE_TESTS.id,
          content: 'SSE Test Comment',
          authorId: USERS.ALICE.id,
        })
        .expect(201);

      const event = await sse.waitForEvent(
        (e) =>
          e &&
          e.domain === 'comment' &&
          e.type === 'created' &&
          e.payload.id === res.body.id,
      );

      expect(event).toMatchObject({
        domain: 'comment',
        type: 'created',
        payload: expect.objectContaining({ content: 'SSE Test Comment' }),
      });
    });

    it('should receive comment:updated event when comment is updated', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      await request(ctx.app.getHttpServer())
        .patch(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.BOB.apiKey)
        .send({ content: 'Updated comment content' })
        .expect(200);

      const event = await sse.waitForEvent(
        (e) =>
          e.domain === 'comment' &&
          e.type === 'updated' &&
          e.payload.id === COMMENTS.PROJECT_LOOKS_GOOD.id,
      );

      expect(event).toMatchObject({
        domain: 'comment',
        type: 'updated',
        payload: expect.objectContaining({
          content: 'Updated comment content',
        }),
      });
    });

    it('should receive comment:deleted event when comment is deleted', async () => {
      sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();

      // COMMENTS.PROJECT_LOOKS_GOOD was created by BOB
      await request(ctx.app.getHttpServer())
        .delete(`/api/comments/${COMMENTS.PROJECT_LOOKS_GOOD.id}`)
        .set('x-api-key', USERS.BOB.apiKey)
        .expect(200);

      const event = await sse.waitForEvent(
        (e) =>
          e &&
          e.domain === 'comment' &&
          e.type === 'deleted' &&
          e.payload.id === COMMENTS.PROJECT_LOOKS_GOOD.id,
      );

      expect(event).toMatchObject({
        domain: 'comment',
        type: 'deleted',
        payload: expect.objectContaining({
          id: COMMENTS.PROJECT_LOOKS_GOOD.id,
        }),
      });
    });
  });
});
