import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommentsModule } from './comments/comments.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';

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
