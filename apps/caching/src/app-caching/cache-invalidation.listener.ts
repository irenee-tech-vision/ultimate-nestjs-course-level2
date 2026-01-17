import { Cache } from '@nestjs/cache-manager';
import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(private readonly cacheManager: Cache) {}

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
    const keys = await this.getAllUserOverrideCacheKeys();
    if (keys.length === 0) return;

    await this.cacheManager.mdel(keys);
    this.logger.debug(
      `Invalidated ${keys.length} UserFeatureFlags:* cache entries`,
    );
  }

  private async getAllUserOverrideCacheKeys() {
    const store = this.cacheManager.stores[0];
    if (!store?.iterator) {
      this.logger.warn(
        'Cache store does not support iteration; unable to get user override cache keys.',
      );
      return [];
    }

    const keys: string[] = [];
    for await (const [key] of store.iterator({})) {
      if (typeof key !== 'string') continue;
      if (!key.startsWith('UserFeatureFlags:')) continue;

      keys.push(key);
    }

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
