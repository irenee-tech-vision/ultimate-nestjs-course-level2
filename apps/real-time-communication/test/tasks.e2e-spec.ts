import * as request from 'supertest';

import { TASKS, seedTasks } from './fixtures/tasks.fixture';
import { USERS } from './fixtures/users.fixture';
import {
  createTestApp,
  resetAndSeed,
  TestContext,
} from './helpers/test-setup.helper';

describe('Tasks (e2e)', () => {
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
        .get('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);
    });

    it('should accept valid API key in cookie', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/tasks')
        .set('Cookie', `apiKey=${USERS.BOB.apiKey}`)
        .expect(200);
    });

    it('should reject invalid API key', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/tasks')
        .set('x-api-key', 'invalid-api-key')
        .expect(401);
    });

    it.each([
      ['GET /api/tasks', 'get', '/api/tasks'],
      ['GET /api/tasks/:id', 'get', `/api/tasks/${TASKS.SETUP_PROJECT.id}`],
      ['POST /api/tasks', 'post', '/api/tasks'],
      ['PATCH /api/tasks/:id', 'patch', `/api/tasks/${TASKS.WRITE_TESTS.id}`],
      ['DELETE /api/tasks/:id', 'delete', `/api/tasks/${TASKS.WRITE_TESTS.id}`],
      [
        'PATCH /api/tasks/:id/status',
        'patch',
        `/api/tasks/${TASKS.WRITE_TESTS.id}/status`,
      ],
      [
        'PATCH /api/tasks/:id/assign',
        'patch',
        `/api/tasks/${TASKS.WRITE_TESTS.id}/assign`,
      ],
    ])('%s should require authentication', (_, method, path) => {
      return (request(ctx.app.getHttpServer()) as any)
        [method](path)
        .expect(401);
    });
  });

  describe('find all: GET /api/tasks', () => {
    const nonDeletedTasks = seedTasks.filter((t) => !t.deletedAt);
    const deletedTasks = seedTasks.filter((t) => t.deletedAt);

    it('should return all non-deleted tasks', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(nonDeletedTasks.length);

      // Verify all returned tasks are non-deleted
      res.body.forEach((task: any) => {
        expect(task.deletedAt).toBeUndefined();
      });

      // Verify deleted tasks are not present
      const deletedIds = deletedTasks.map((t) => t.id);
      const returnedIds = res.body.map((t: any) => t.id);
      deletedIds.forEach((id) => {
        expect(returnedIds).not.toContain(id);
      });
    });

    it('should include deleted tasks when includeDeleted=true', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/tasks?includeDeleted=true')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(seedTasks.length);

      // Verify deleted tasks are now present with deletedAt
      const deletedIds = deletedTasks.map((t) => t.id);
      deletedIds.forEach((id) => {
        const task = res.body.find((t: any) => t.id === id);
        expect(task).toBeDefined();
        expect(task.deletedAt).toBeDefined();
      });
    });

    it('should filter tasks by changedSince', async () => {
      const cutoffDate = new Date('2025-12-25T00:00:00Z');
      const expectedTasks = nonDeletedTasks.filter(
        (t) => t.updatedAt > cutoffDate,
      );

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/tasks?changedSince=${cutoffDate.toISOString()}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body).toHaveLength(expectedTasks.length);

      res.body.forEach((task: any) => {
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(
          cutoffDate.getTime(),
        );
      });
    });

    it('should return tasks modified after changedSince', async () => {
      const beforeUpdate = new Date().toISOString();
      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ title: 'Modified task' })
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/tasks?changedSince=${beforeUpdate}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(TASKS.WRITE_TESTS.id);
    });

    it('should include deleted tasks in changedSince when includeDeleted=true', async () => {
      const beforeDelete = new Date().toISOString();
      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(ctx.app.getHttpServer())
        .delete(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/tasks?changedSince=${beforeDelete}&includeDeleted=true`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const deletedTask = res.body.find(
        (t: any) => t.id === TASKS.WRITE_TESTS.id,
      );
      expect(deletedTask).toBeDefined();
      expect(deletedTask.deletedAt).toBeDefined();
    });
  });

  describe('find one: GET /api/tasks/:id', () => {
    it('should return a specific task', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/tasks/${TASKS.SETUP_PROJECT.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.id).toBe(TASKS.SETUP_PROJECT.id);
      expect(res.body.title).toBe(TASKS.SETUP_PROJECT.title);
    });

    it('should return 404 for non-existent task', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/tasks/non-existent-id')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(404);
    });

    it('should return deleted task (with deletedAt field)', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/tasks/${TASKS.DELETED_DARK_MODE.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      expect(res.body.id).toBe(TASKS.DELETED_DARK_MODE.id);
      expect(res.body.deletedAt).toBeDefined();
    });
  });

  describe('create: POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Test Task',
        description: 'Test description',
        status: 'to-do',
      };

      const res = await request(ctx.app.getHttpServer())
        .post('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .send(newTask)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(newTask.title);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('should create task with assignee', async () => {
      const newTask = {
        title: 'Assigned Task',
        description: 'Task with assignee',
        status: 'to-do',
        assigneeId: USERS.BOB.id,
      };

      const res = await request(ctx.app.getHttpServer())
        .post('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .send(newTask)
        .expect(201);

      expect(res.body.assigneeId).toBe(USERS.BOB.id);
      expect(res.body.assigneeName).toBe(USERS.BOB.name);
    });
  });

  describe('update: PATCH /api/tasks/:id', () => {
    it('should update a task', async () => {
      const update = { title: 'Updated Title' };

      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send(update)
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
    });

    it('should return 404 for deleted task', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.DELETED_DARK_MODE.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ title: 'Should Fail' })
        .expect(404);
    });
  });

  describe('delete: DELETE /api/tasks/:id', () => {
    it('should soft delete a task', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/api/tasks/${TASKS.WRITE_TESTS.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const listRes = await request(ctx.app.getHttpServer())
        .get('/api/tasks')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const deletedTask = listRes.body.find(
        (t: any) => t.id === TASKS.WRITE_TESTS.id,
      );
      expect(deletedTask).toBeUndefined();

      const includeDeletedRes = await request(ctx.app.getHttpServer())
        .get('/api/tasks?includeDeleted=true')
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(200);

      const foundTask = includeDeletedRes.body.find(
        (t: any) => t.id === TASKS.WRITE_TESTS.id,
      );
      expect(foundTask).toBeDefined();
      expect(foundTask.deletedAt).toBeDefined();
    });

    it('should return 404 for already deleted task', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/api/tasks/${TASKS.DELETED_DARK_MODE.id}`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .expect(404);
    });
  });

  describe('update status: PATCH /api/tasks/:id/status', () => {
    it('should change task status', async () => {
      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}/status`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(res.body.status).toBe('in-progress');
    });

    it('should return 404 for deleted task', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.DELETED_DARK_MODE.id}/status`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ status: 'in-progress' })
        .expect(404);
    });
  });

  describe('assign: PATCH /api/tasks/:id/assign', () => {
    it('should assign task to user', async () => {
      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.WRITE_TESTS.id}/assign`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ assigneeId: USERS.CHARLIE.id })
        .expect(200);

      expect(res.body.assigneeId).toBe(USERS.CHARLIE.id);
      expect(res.body.assigneeName).toBe(USERS.CHARLIE.name);
    });

    it('should return 404 for deleted task', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/api/tasks/${TASKS.DELETED_DARK_MODE.id}/assign`)
        .set('x-api-key', USERS.ALICE.apiKey)
        .send({ assigneeId: USERS.CHARLIE.id })
        .expect(404);
    });
  });
});
