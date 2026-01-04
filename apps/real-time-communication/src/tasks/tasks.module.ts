import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [UsersModule, EventsModule],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService],
})
export class TasksModule {}
