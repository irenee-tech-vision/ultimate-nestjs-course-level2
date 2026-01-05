import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { extractWsApiKey } from './ws-api-key.utils';

@Injectable()
export class WsApiKeyGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const apiKey = extractWsApiKey(client);

    if (!apiKey) {
      return false;
    }

    const user = this.usersService.findByApiKey(apiKey);
    if (!user) {
      return false;
    }

    return true;
  }
}
