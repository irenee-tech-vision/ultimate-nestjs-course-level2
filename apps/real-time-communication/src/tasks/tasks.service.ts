import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { TaskSse } from '../events/events/task.sse';
import { UsersService } from '../users/users.service';
import {
  filterEntities,
  sortEntitiesByLatestChange,
} from '../utils/entity-query.utils';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { getInternalPriority } from './get-internal-priority';
import { TasksRepository } from './tasks.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TASK_EVENTS,
  TaskAssignedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from './events/tasks.event';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  create(createTaskDto: CreateTaskDto): Task {
    const now = new Date();
    let assigneeName: string | undefined;

    if (createTaskDto.assigneeId) {
      const user = this.usersService.findOne(createTaskDto.assigneeId);
      assigneeName = user?.name;
    }

    const task = new Task({
      id: crypto.randomUUID(),
      ...createTaskDto,
      assigneeName,
      createdAt: now,
      updatedAt: now,
      internalPriority: getInternalPriority({
        title: createTaskDto.title,
        description: createTaskDto.description,
      }),
    });

    this.eventEmitter.emit(TASK_EVENTS.CREATED, new TaskCreatedEvent(task));
    return this.tasksRepository.create(task);
  }

  findAll({
    changedSince,
    includeDeleted,
  }: {
    changedSince?: Date;
    includeDeleted?: boolean;
  }): Task[] {
    const allTasks = this.tasksRepository.findAll();
    const filtered = filterEntities(allTasks, { includeDeleted, changedSince });
    return sortEntitiesByLatestChange(filtered);
  }

  findOne(id: string): Task | undefined {
    return this.tasksRepository.findOne(id);
  }

  update(id: string, updateTaskDto: UpdateTaskDto): Task | undefined {
    const task = this.tasksRepository.update(id, {
      ...updateTaskDto,
      updatedAt: new Date(),
    });

    if (task) {
      this.eventEmitter.emit(TASK_EVENTS.UPDATED, new TaskUpdatedEvent(task));
    }

    return task;
  }

  remove(id: string): Task | undefined {
    const now = new Date();
    const task = this.tasksRepository.update(id, {
      deletedAt: now,
      updatedAt: now,
    });

    if (task) {
      this.eventEmitter.emit(TASK_EVENTS.DELETED, new TaskDeletedEvent(task));
    }

    return task;
  }

  assign(id: string, assignTaskDto: AssignTaskDto): Task | undefined {
    const newAssigneeId = assignTaskDto.assigneeId;

    let assigneeName: string | undefined;
    if (newAssigneeId) {
      const user = this.usersService.findOne(newAssigneeId);
      assigneeName = user?.name;
    }

    const prevAssigneeId = this.findOne(id)?.assigneeId;

    const task = this.tasksRepository.update(id, {
      assigneeId: newAssigneeId,
      assigneeName,
      updatedAt: new Date(),
    });

    if (task) {
      this.eventEmitter.emit(TASK_EVENTS.ASSIGNED, new TaskAssignedEvent(task, prevAssigneeId));
    }

    return task;
  }

  changeStatus(id: string, changeStatusDto: ChangeStatusDto): Task | undefined {
    const task = this.tasksRepository.update(id, {
      status: changeStatusDto.status,
      updatedAt: new Date(),
    });

    if (task) {
      this.eventEmitter.emit(TASK_EVENTS.UPDATED, new TaskUpdatedEvent(task));
    }

    return task;
  }
}
