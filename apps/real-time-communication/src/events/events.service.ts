import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { finalize, merge, Subject } from 'rxjs';
import {
  COMMENT_EVENTS,
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentUpdatedEvent,
} from '../comments/events/comments.event';
import {
  TASK_EVENTS,
  TaskAssignedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from '../tasks/events/tasks.event';
import { SseClient } from './client.interface';
import { CommentSse } from './events/comment.sse';
import { HeartbeatSse } from './events/heartbeat.sse';
import { TaskSse } from './events/task.sse';

type DomainSse = TaskSse | CommentSse;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<HeartbeatSse>();
  private broadcast$ = new Subject<DomainSse>();
  private heartbeatInterval: NodeJS.Timeout;
  private clients = new Map<string, SseClient>();

  onModuleInit() {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat$.next(new HeartbeatSse());
    }, 3000);
  }

  onModuleDestroy() {
    clearInterval(this.heartbeatInterval);
  }

  @OnEvent(TASK_EVENTS.CREATED)
  handleTaskCreated(event: TaskCreatedEvent) {
    this.broadcast(new TaskSse('created', event.task));
  }

  @OnEvent(TASK_EVENTS.DELETED)
  handleTaskDeleted(event: TaskDeletedEvent) {
    this.broadcast(new TaskSse('deleted', event.task));
  }

  @OnEvent(TASK_EVENTS.UPDATED)
  handleTaskUpdated(event: TaskUpdatedEvent) {
    this.broadcast(new TaskSse('updated', event.task));
  }

  @OnEvent(TASK_EVENTS.ASSIGNED)
  handleTaskAssigned(event: TaskAssignedEvent) {
    this.broadcast(new TaskSse('updated', event.task));

    if (event.task.assigneeId) {
      this.sendToUser(
        event.task.assigneeId,
        new TaskSse('assigned', event.task),
      );
    }

    if (event.previousAssignee) {
      this.sendToUser(
        event.previousAssignee,
        new TaskSse('assigned', event.task),
      );
    }
  }

  @OnEvent(COMMENT_EVENTS.CREATED)
  handleCommentCreated(event: CommentCreatedEvent) {
    this.broadcast(new CommentSse('created', event.comment));
  }

  @OnEvent(COMMENT_EVENTS.UPDATED)
  handleCommentUpdated(event: CommentUpdatedEvent) {
    this.broadcast(new CommentSse('updated', event.comment));
  }

  @OnEvent(COMMENT_EVENTS.DELETED)
  handleCommentDeleted(event: CommentDeletedEvent) {
    this.broadcast(new CommentSse('deleted', event.comment));
  }

  getEventStream() {
    return merge(
      this.heartbeat$.asObservable(),
      this.broadcast$.asObservable(),
    );
  }

  registerClient(userId: string) {
    const client: SseClient = {
      id: crypto.randomUUID(),
      userId,
      events$: new Subject<MessageEvent>(),
      connectedAt: new Date(),
    };

    this.clients.set(client.id, client);

    return merge(
      this.heartbeat$.asObservable(),
      this.broadcast$.asObservable(),
      client.events$,
    ).pipe(
      finalize(() => {
        this.clients.delete(client.id);
        client.events$.complete();
      }),
    );
  }

  broadcast(event: DomainSse) {
    this.broadcast$.next(event);
  }

  sendToUser(userId: string, event: DomainSse) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        client.events$.next(event);
      }
    }
  }
}
