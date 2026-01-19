import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class UserFeatureFlagsCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') {
      return undefined;
    }

    const userId = request.user?._id?.toString();
    const environment = request.query.environment;
    if (userId && environment) {
      return `UserFeatureFlags:${userId}:${environment}`;
    }
    // Returning undefined disables caching for this request
    return undefined;
  }
}
