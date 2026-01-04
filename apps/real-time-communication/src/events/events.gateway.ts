import { Socket, Server } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

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
}
