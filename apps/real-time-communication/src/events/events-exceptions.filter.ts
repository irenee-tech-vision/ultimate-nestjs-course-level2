import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class EventsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    if (exception instanceof WsException) {
      const error = exception.getError();
      client.emit('exception', {
        status: 'error',
        message:
          typeof error === 'string'
            ? error
            : (error as any)?.message || 'WebSocket error',
      });

      return;
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      client.emit('exception', {
        status: 'error',
        message:
          typeof response === 'string'
            ? response
            : (response as any)?.message || 'Validation error',
      });
      return;
    }

    client.emit('exception', {
      status: 'error',
      message: 'Internal server error',
    });
  }
}
