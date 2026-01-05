import { UseGuards } from '@nestjs/common';
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

@UseGuards(WsApiKeyGuard)
@WebSocketGateway()
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

    this.server.emit('connection', {
      message: 'New client connected',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.server.emit('disconnected', {
      message: 'Client disconnected',
      clientId: client.id,
    });
  }

  @SubscribeMessage('ping')
  handlePing(): WsResponse {
    console.log(`Received ping message`);
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  broadcastEvent(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingStartDto,
  ): void {
    client.broadcast.emit('typing:update', {
      taskId: payload.taskId,
      userId: payload.userId,
      userName: payload.userName,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingStopDto,
  ): void {
    client.broadcast.emit('typing:update', {
      taskId: payload.taskId,
      userId: payload.userId,
      isTyping: false,
    });
  }
}
