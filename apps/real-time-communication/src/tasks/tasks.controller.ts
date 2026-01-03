import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, Subject, merge } from 'rxjs';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { TaskSseEvent } from './events/task-sse.event';

@Controller('tasks')
export class TasksController implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<MessageEvent>();
  private heartbeatInterval: NodeJS.Timeout;
  private tasksEvents$ = new Subject<TaskSseEvent>();

  constructor(private readonly tasksService: TasksService) {}

  onModuleInit() {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat$.next({
        id: crypto.randomUUID(),
        data: { type: 'heartbeat', timestamp: new Date().toISOString() },
      });
    }, 3000);
  }

  onModuleDestroy() {
    console.log('shutting down');
    clearInterval(this.heartbeatInterval);
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    return merge(
      this.heartbeat$.asObservable(),
      this.tasksEvents$.asObservable(),
    );
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    const task = this.tasksService.create(createTaskDto);
    this.tasksEvents$.next(new TaskSseEvent('created', task));
    return task;
  }

  @Get()
  findAll(@Query() query: FindTasksQueryDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const task = this.tasksService.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const task = this.tasksService.update(id, updateTaskDto);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.tasksEvents$.next(new TaskSseEvent('updated', task));
    return task;
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() assignTaskDto: AssignTaskDto) {
    const task = this.tasksService.assign(id, assignTaskDto);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.tasksEvents$.next(new TaskSseEvent('updated', task));
    return task;
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    const task = this.tasksService.changeStatus(id, changeStatusDto);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.tasksEvents$.next(new TaskSseEvent('updated', task));
    return task;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deletedTask = this.tasksService.remove(id);
    if (!deletedTask) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.tasksEvents$.next(new TaskSseEvent('deleted', deletedTask));
    return deletedTask;
  }
}
