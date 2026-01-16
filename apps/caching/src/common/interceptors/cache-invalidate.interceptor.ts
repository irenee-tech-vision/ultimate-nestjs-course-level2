import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import {
  CACHE_INVALIDATE_KEY,
  CacheKeyFactory,
} from '../decorators/cache-invalidate.decorator';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheManager: Cache,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const keys = this.reflector.get<(string | CacheKeyFactory)[]>(
      CACHE_INVALIDATE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(async () => {
        if (!keys.length) {
          return;
        }

        const request = context.switchToHttp().getRequest();
        const keysToInvalidate = keys.flatMap((key) => {
          if (typeof key === 'function') {
            return key(request);
          }

          return [key];
        });

        await this.cacheManager.mdel(keysToInvalidate)
      }),
    );
  }
}
