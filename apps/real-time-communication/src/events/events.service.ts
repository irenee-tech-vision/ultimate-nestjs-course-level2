import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { merge, Observable, Subject, finalize } from 'rxjs';
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
