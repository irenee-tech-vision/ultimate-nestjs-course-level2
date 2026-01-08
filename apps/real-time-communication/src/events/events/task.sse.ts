import { MessageEvent } from '@nestjs/common';
import { Task } from '../../tasks/entities/task.entity';

interface TaskSseData {
  domain: 'task';
  type: 'created' | 'updated' | 'deleted' | 'assigned';
  payload: Task;
}

export class TaskSse implements MessageEvent {
  data: TaskSseData;
  id: string;

  constructor(type: TaskSseData['type'], task: Task) {
    this.id = crypto.randomUUID();
    this.data = {
      domain: 'task',
      type,
      payload: task,
    };
  }
}
