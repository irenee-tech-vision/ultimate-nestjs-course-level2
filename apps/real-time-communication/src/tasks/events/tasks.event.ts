import { Task } from '../entities/task.entity';

export const TASK_EVENTS = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  DELETED: 'task.deleted',
  ASSIGNED: 'task.assigned',
  ALL: 'task.*'
} as const;

export class TaskCreatedEvent {
  static readonly eventName = TASK_EVENTS.CREATED;

  constructor(public readonly task: Task) {}
}

export class TaskUpdatedEvent {
  static readonly eventName = TASK_EVENTS.UPDATED;

  constructor(public readonly task: Task) {}
}

export class TaskDeletedEvent {
  static readonly eventName = TASK_EVENTS.DELETED;

  constructor(public readonly task: Task) {}
}

export class TaskAssignedEvent {
  static readonly eventName = TASK_EVENTS.ASSIGNED;

  constructor(
    public readonly task: Task,
    public readonly previousAssignee?: string,
  ) {}
}
