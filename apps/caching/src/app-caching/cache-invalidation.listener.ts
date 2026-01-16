import { Cache } from '@nestjs/cache-manager';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  FEATURE_FLAG_EVENTS,
  FeatureFlagCreatedEvent,
  FeatureFlagDeletedEvent,
  FeatureFlagUpdatedEvent,
} from '../feature-flags/events/feature-flag.events';

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

    this.logger.debug(`Invalidated FeatureFlag:all and FeatureFlag:${id}`);
  }
}
