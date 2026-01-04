import { Socket, Server } from 'socket.io';
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
import { TypingStartDto } from './dto/typing-start.dto';
import { TypingStopDto } from './dto/typing-stop.dto';

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
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
