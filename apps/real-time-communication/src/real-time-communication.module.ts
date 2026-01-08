import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { EventsModule } from './events/events.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

// NOTE: Monorepo path, uncomment when using monorepo
const CLIENT_ROOT_PATH = join(
  __dirname,
  '../../..',
  'apps',
  'real-time-communication',
  'client',
);

// NOTE: Standard path, uncomment when not using monorepo
// const CLIENT_ROOT_PATH = join(__dirname, '..', 'client');

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true
    }),
    ServeStaticModule.forRoot({
      rootPath: CLIENT_ROOT_PATH,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TasksModule,
    UsersModule,
    CommentsModule,
    AuthModule,
    EventsModule,
  ],
  controllers: [],
})
export class RealTimeCommunicationModule {}
