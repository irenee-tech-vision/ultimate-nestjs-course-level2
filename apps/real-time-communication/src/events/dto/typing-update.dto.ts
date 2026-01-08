import { WsResponse } from '@nestjs/websockets';

export class TypingUpdateDtoData {
  taskId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;

  constructor(partial: Partial<TypingUpdateDtoData>) {
    Object.assign(this, partial);
  }
}

export class TypingUpdateDto implements WsResponse<TypingUpdateDtoData> {
  event = 'typing:update';
  data: TypingUpdateDtoData;

  constructor(data: TypingUpdateDtoData) {
    this.data = new TypingUpdateDtoData(data);
  }
}
