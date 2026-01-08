import { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseClient {
  id: string;
  userId: string;
  events$: Subject<MessageEvent>;
  connectedAt: Date;
}
