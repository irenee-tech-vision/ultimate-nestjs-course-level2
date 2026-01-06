import {
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsApiKeyGuard } from '../auth/ws-api-key.guard';
import { TypingStartDto } from './dto/typing-start.dto';
import { TypingStopDto } from './dto/typing-stop.dto';
import { extractWsApiKey } from '../auth/ws-api-key.utils';
import { UsersService } from '../users/users.service';
import { PongDto } from './dto/pong.dto';
import { instanceToPlain } from 'class-transformer';
import { TypingUpdateDto } from './dto/typing-update.dto';

@UsePipes(ValidationPipe)
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(WsApiKeyGuard)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:8080',
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly usersService: UsersService) {}

  handleConnection(client: Socket) {
    const apiKey = extractWsApiKey(client);
    if (!apiKey) {
      client.disconnect();
      return;
    }

    const user = this.usersService.findByApiKey(apiKey);
    if (!user) {
      client.disconnect();
      return;
    }

    this.broadcastEvent({
      event: 'connection',
      data: {
        message: 'New client connected',
        clientId: client.id,
      },
    });
  }

  handleDisconnect(client: Socket) {
    this.broadcastEvent({
      event: 'disconnected',
      data: {
        message: 'Client disconnected',
        clientId: client.id,
      },
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): WsResponse {
    console.log(`Received ping message`);
    return new PongDto(client.id);
  }

  broadcastEvent({
    event,
    data,
    client,
  }: {
    event: string;
    data: any;
    client?: Socket;
  }) {
    if (client) {
      client.broadcast.emit(event, instanceToPlain(data));
      return;
    }

    this.server.emit(event, instanceToPlain(data));
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingStartDto,
  ): void {
    const response = new TypingUpdateDto({
      taskId: payload.taskId,
      userId: payload.userId,
      userName: payload.userName,
      isTyping: true,
    });
    this.broadcastEvent({
      event: response.event,
      data: response,
      client,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingStopDto,
  ): void {
    const response = new TypingUpdateDto({
      taskId: payload.taskId,
      userId: payload.userId,
      isTyping: true,
    });

    this.broadcastEvent({
      event: response.event,
      data: response,
      client,
    });
  }
}
