import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { merge, Subject } from 'rxjs';
import { CommentSse } from './events/comment.sse';
import { HeartbeatSse } from './events/heartbeat.sse';
import { TaskSse } from './events/task.sse';

type BroadcastSse = TaskSse | CommentSse;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<HeartbeatSse>();
  private broadcast$ = new Subject<BroadcastSse>();
  private heartbeatInterval: NodeJS.Timeout;

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

  broadcast(event: BroadcastSse) {
    this.broadcast$.next(event);
  }
}
