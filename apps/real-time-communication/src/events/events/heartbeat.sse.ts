import { MessageEvent } from '@nestjs/common';

interface HeartbeatSseData {
  type: 'heartbeat';
  timestamp: number;
}

export class HeartbeatSse implements MessageEvent {
  data: HeartbeatSseData;
  id: string;

  constructor() {
    this.id = crypto.randomUUID();
    this.data = {
      type: 'heartbeat',
      timestamp: new Date().getTime(),
    };
  }
}
