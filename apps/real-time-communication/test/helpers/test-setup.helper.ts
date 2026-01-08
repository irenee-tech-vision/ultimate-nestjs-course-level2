import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';

import { CommentsRepository } from '../../src/comments/comments.repository';
import { RealTimeCommunicationModule } from '../../src/real-time-communication.module';
import { TasksRepository } from '../../src/tasks/tasks.repository';
import { UsersRepository } from '../../src/users/users.repository';
import {
  COMMENTS,
  seedComments,
  seedTasks,
  seedUsers,
  TASKS,
  USERS,
} from '../fixtures';

export interface TestContext {
  app: INestApplication;
  usersRepo: UsersRepository;
  tasksRepo: TasksRepository;
  commentsRepo: CommentsRepository;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [RealTimeCommunicationModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Match main.ts configuration
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  await app.init();

  return {
    app,
    usersRepo: moduleFixture.get(UsersRepository),
    tasksRepo: moduleFixture.get(TasksRepository),
    commentsRepo: moduleFixture.get(CommentsRepository),
  };
}

export function resetAndSeed(ctx: TestContext): void {
  ctx.usersRepo.reset();
  ctx.tasksRepo.reset();
  ctx.commentsRepo.reset();

  ctx.usersRepo.seed(seedUsers);
  ctx.tasksRepo.seed(seedTasks);
  ctx.commentsRepo.seed(seedComments);
}
