import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { merge, Subject } from 'rxjs';
import { HeartbeatSse } from './events/heartbeat.sse';
import { TaskSse } from './events/task.sse';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<HeartbeatSse>();
  private broadcast$ = new Subject<TaskSse>();
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

  broadcast(event: TaskSse) {
    this.broadcast$.next(event);
  }
}
