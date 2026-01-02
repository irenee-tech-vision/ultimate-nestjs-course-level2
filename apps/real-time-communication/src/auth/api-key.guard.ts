import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const user = this.usersService.findByApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach the authenticated user to the request
    request['user'] = user;

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    const headerKey = request.headers['x-api-key'];
    if (headerKey && typeof headerKey === 'string') {
      return headerKey;
    }

    const cookieKey = request.cookies?.['apiKey'];
    if (cookieKey && typeof cookieKey === 'string') {
      return cookieKey;
    }

    return undefined;
  }
}
