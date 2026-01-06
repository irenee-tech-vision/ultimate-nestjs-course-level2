import { WsResponse } from '@nestjs/websockets';
import { Exclude } from 'class-transformer';

export class PongDtoData {
  timestamp: number;

  @Exclude()
  clientId: string;

  constructor(partial: Partial<PongDtoData>) {
    Object.assign(this, partial);
  }
}

export class PongDto implements WsResponse<PongDtoData> {
  event = 'pong';
  data: PongDtoData;

  constructor(clientId: string) {
    this.data = new PongDtoData({
      timestamp: Date.now(),
      clientId,
    });
  }
}
