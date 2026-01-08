import { Comment } from '../../src/comments/entities/comment.entity';
import { USERS } from './users.fixture';
import { TASKS } from './tasks.fixture';

export const COMMENTS = {
  // Comment on "Set up project" (completed task)
  PROJECT_LOOKS_GOOD: new Comment({
    id: '11111111-1111-1111-1111-111111111111',
    taskId: TASKS.SETUP_PROJECT.id,
    content: 'Project structure looks good!',
    authorId: USERS.BOB.id,
    createdAt: new Date('2025-12-02T14:00:00Z'),
    updatedAt: new Date('2025-12-02T14:00:00Z'),
    sentimentScore: 0.95,
  }),

  // Comments on "Implement authentication" (in-progress task)
  AUTH_QUESTION: new Comment({
    id: '22222222-2222-2222-2222-222222222222',
    taskId: TASKS.IMPLEMENT_AUTH.id,
    content: 'Should we use JWT or session-based auth?',
    authorId: USERS.ALICE.id,
    createdAt: new Date('2025-12-16T11:30:00Z'),
    updatedAt: new Date('2025-12-16T11:30:00Z'),
    sentimentScore: -0.1,
  }),
  AUTH_ANSWER: new Comment({
    id: '33333333-3333-3333-3333-333333333333',
    taskId: TASKS.IMPLEMENT_AUTH.id,
    content: 'JWT would be better for our use case',
    authorId: USERS.CHARLIE.id,
    createdAt: new Date('2025-12-16T14:15:00Z'),
    updatedAt: new Date('2025-12-16T14:15:00Z'),
    sentimentScore: 0.2,
  }),

  // Comment on "Set up database connection" (completed task)
  DB_WORKING: new Comment({
    id: '44444444-4444-4444-4444-444444444444',
    taskId: TASKS.SETUP_DATABASE.id,
    content: 'PostgreSQL connection is working smoothly now',
    authorId: USERS.BOB.id,
    createdAt: new Date('2025-12-05T10:00:00Z'),
    updatedAt: new Date('2025-12-05T10:00:00Z'),
    sentimentScore: 0.8,
  }),

  // Comment on "Deploy to production" (blocked task)
  DEPLOY_BLOCKED: new Comment({
    id: '55555555-5555-5555-5555-555555555555',
    taskId: TASKS.DEPLOY_PRODUCTION.id,
    content: 'Blocked until authentication is complete',
    authorId: USERS.BOB.id,
    createdAt: new Date('2025-12-20T09:00:00Z'),
    updatedAt: new Date('2025-12-20T09:00:00Z'),
    sentimentScore: -0.3,
  }),

  // Comment on "Build dashboard UI" (in-progress task)
  DASHBOARD_STARTING: new Comment({
    id: '66666666-6666-6666-6666-666666666666',
    taskId: TASKS.BUILD_DASHBOARD.id,
    content: 'The wireframes look great, starting implementation',
    authorId: USERS.ALICE.id,
    createdAt: new Date('2025-12-18T15:00:00Z'),
    updatedAt: new Date('2025-12-18T15:00:00Z'),
    sentimentScore: 0.85,
  }),

  // Comment on "Write tests" (to-do task)
  TESTS_COVERAGE: new Comment({
    id: '77777777-7777-7777-7777-777777777777',
    taskId: TASKS.WRITE_TESTS.id,
    content: 'We should aim for at least 80% coverage',
    authorId: USERS.CHARLIE.id,
    createdAt: new Date('2025-12-10T11:30:00Z'),
    updatedAt: new Date('2025-12-10T11:30:00Z'),
    sentimentScore: 0.1,
  }),

  // ===== DELETED COMMENTS =====
  // Deleted comment on "Implement dark mode" (deleted task)
  DELETED_DARK_MODE_COMMENT: new Comment({
    id: 'dead1111-dead-1111-dead-111111111111',
    taskId: TASKS.DELETED_DARK_MODE.id,
    content: 'I can start on this next week',
    authorId: USERS.ALICE.id,
    createdAt: new Date('2025-12-05T14:00:00Z'),
    updatedAt: new Date('2025-12-08T14:00:00Z'),
    deletedAt: new Date('2025-12-08T14:00:00Z'),
    sentimentScore: 0.3,
  }),

  // Deleted comment on "Add email notifications" (deleted task)
  DELETED_EMAIL_COMMENT: new Comment({
    id: 'cafe1111-cafe-1111-cafe-111111111111',
    taskId: TASKS.DELETED_EMAIL_NOTIFICATIONS.id,
    content: 'Which email service should we use?',
    authorId: USERS.BOB.id,
    createdAt: new Date('2025-12-10T15:00:00Z'),
    updatedAt: new Date('2025-12-15T16:00:00Z'),
    deletedAt: new Date('2025-12-15T16:00:00Z'),
    sentimentScore: -0.1,
  }),

  // Deleted comment on active task (comment removed, task still exists)
  DELETED_AUTH_COMMENT: new Comment({
    id: 'f00d1111-f00d-1111-f00d-111111111111',
    taskId: TASKS.IMPLEMENT_AUTH.id,
    content: 'This approach is completely wrong',
    authorId: USERS.CHARLIE.id,
    createdAt: new Date('2025-12-17T09:00:00Z'),
    updatedAt: new Date('2025-12-17T10:00:00Z'),
    deletedAt: new Date('2025-12-17T10:00:00Z'),
    sentimentScore: -0.9,
  }),
};

export const seedComments = Object.values(COMMENTS);
