import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagsCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') {
      return undefined;
    }

    const id = request.params.id;
    if (id) {
      return `FeatureFlag:${id}`;
    }
    
    return 'FeatureFlag:all';
  }
}
