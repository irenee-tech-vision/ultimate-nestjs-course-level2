import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksRepository implements OnModuleInit {
  private tasks: Task[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DATA') === 'true') {
      const { seedTasks } = await import('../../test/fixtures/tasks.fixture');
      this.seed(seedTasks);
    }
  }

  // CRUD operations
  create(task: Task): Task {
    this.tasks.push(task);
    return task;
  }

  findAll(): Task[] {
    return this.tasks;
  }

  findOne(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  findOneActive(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id && !task.deletedAt);
  }

  update(id: string, updates: Partial<Task>): Task | undefined {
    const taskIndex = this.tasks.findIndex(
      (task) => task.id === id && !task.deletedAt,
    );
    if (taskIndex === -1) {
      return undefined;
    }
    this.tasks[taskIndex] = new Task({
      ...this.tasks[taskIndex],
      ...updates,
    });
    return this.tasks[taskIndex];
  }

  // Testing utilities
  reset(): void {
    this.tasks = [];
  }

  seed(tasks: Task[]): void {
    this.tasks = [...tasks];
  }

  count(): number {
    return this.tasks.length;
  }
}
