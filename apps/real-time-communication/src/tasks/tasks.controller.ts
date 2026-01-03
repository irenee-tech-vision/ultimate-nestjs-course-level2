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
import { Observable, Subject } from 'rxjs';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<MessageEvent>();
  private heartbeatInterval: NodeJS.Timeout;

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
    return this.heartbeat$.asObservable();
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
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
    return task;
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() assignTaskDto: AssignTaskDto) {
    const task = this.tasksService.assign(id, assignTaskDto);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
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
    return task;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deletedTask = this.tasksService.remove(id);
    if (!deletedTask) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return deletedTask;
  }
}
