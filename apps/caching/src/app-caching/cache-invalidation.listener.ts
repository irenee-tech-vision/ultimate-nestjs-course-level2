import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  FEATURE_FLAG_EVENTS,
  FeatureFlagCreatedEvent,
  FeatureFlagDeletedEvent,
  FeatureFlagUpdatedEvent,
} from '../feature-flags/events/feature-flag.events';
import {
  OVERRIDE_EVENTS,
  OverrideCreatedEvent,
  OverrideDeletedEvent,
  OverrideUpdatedEvent,
} from '../overrides/events/override.events';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(
    private readonly cacheManager: Cache,
    @Inject(REDIS_CLIENT) private redisClient: Redis,
  ) {}

  @OnEvent(FEATURE_FLAG_EVENTS.ALL)
  async handleFeatureFlagEvent(
    event:
      | FeatureFlagCreatedEvent
      | FeatureFlagUpdatedEvent
      | FeatureFlagDeletedEvent,
  ) {
    const id = event.flag._id!.toHexString();
    this.cacheManager.del(`FeatureFlag:all`);
    this.cacheManager.del(`FeatureFlag:${id}`);
    this.clearAllOverrideCaches();

    this.logger.debug(`Invalidated FeatureFlag:all and FeatureFlag:${id}`);
  }

  @OnEvent(OVERRIDE_EVENTS.ALL)
  async handleOverrideEvent(
    event: OverrideCreatedEvent | OverrideUpdatedEvent | OverrideDeletedEvent,
  ) {
    const { environment, userId } = event.override;

    this.logger.debug(
      `Override event received for environment: ${environment} and userId: ${userId}`,
    );

    if (userId) {
      this.invalidateUserOverrideCaches(userId, environment);
    } else {
      this.clearAllOverrideCaches();
    }
  }

  private async clearAllOverrideCaches() {
    const keys = await this.scanKeys('keyv::keyv:UserFeatureFlags:*');
    if (keys.length === 0) return;

    await this.redisClient.del(...keys);
    this.logger.debug(
      `Invalidated ${keys.length} UserFeatureFlags:* cache entries`,
    );
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      console.log('foundKeys', foundKeys);
      console.log('cursor', cursor);

      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }

  private async invalidateUserOverrideCaches(
    userId: string,
    environment: string,
  ) {
    await this.cacheManager.del(`UserFeatureFlags:${userId}:${environment}`);
    this.logger.debug(`Invalidated UserFeatureFlags:${userId}:${environment}`);
  }
}
