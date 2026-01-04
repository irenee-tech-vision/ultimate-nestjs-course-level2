import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { HeartbeatSse } from './events/heartbeat.sse';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private heartbeat$ = new Subject<HeartbeatSse>();
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
    return this.heartbeat$.asObservable();
  }
}
