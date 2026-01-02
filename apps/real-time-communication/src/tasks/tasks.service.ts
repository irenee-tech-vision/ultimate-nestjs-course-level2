import { Injectable } from '@nestjs/common';
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

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly usersService: UsersService,
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
    return this.tasksRepository.update(id, {
      ...updateTaskDto,
      updatedAt: new Date(),
    });
  }

  remove(id: string): Task | undefined {
    const now = new Date();
    return this.tasksRepository.update(id, {
      deletedAt: now,
      updatedAt: now,
    });
  }

  assign(id: string, assignTaskDto: AssignTaskDto): Task | undefined {
    const newAssigneeId = assignTaskDto.assigneeId;

    let assigneeName: string | undefined;
    if (newAssigneeId) {
      const user = this.usersService.findOne(newAssigneeId);
      assigneeName = user?.name;
    }

    return this.tasksRepository.update(id, {
      assigneeId: newAssigneeId,
      assigneeName,
      updatedAt: new Date(),
    });
  }

  changeStatus(id: string, changeStatusDto: ChangeStatusDto): Task | undefined {
    return this.tasksRepository.update(id, {
      status: changeStatusDto.status,
      updatedAt: new Date(),
    });
  }
}
