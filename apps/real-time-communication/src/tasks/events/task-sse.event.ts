import { MessageEvent } from '@nestjs/common';
import { Task } from '../entities/task.entity';

interface TaskSseEventData {
  domain: 'task';
  type: 'created' | 'updated' | 'deleted';
  payload: Task;
}

export class TaskSseEvent implements MessageEvent {
  data: TaskSseEventData;
  id: string;

  constructor(type: TaskSseEventData['type'], task: Task) {
    this.id = crypto.randomUUID();
    this.data = {
      domain: 'task',
      type,
      payload: task,
    };
  }
}
