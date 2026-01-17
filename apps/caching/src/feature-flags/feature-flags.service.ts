import { Cache } from '@nestjs/cache-manager';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoRepository } from '../mongo-connection/mongo.repository';
import { OverridesService } from '../overrides/overrides.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlag } from './entities/feature-flag.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  FEATURE_FLAG_EVENTS,
  FeatureFlagCreatedEvent,
  FeatureFlagDeletedEvent,
  FeatureFlagUpdatedEvent,
} from './events/feature-flag.events';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private readonly repository: MongoRepository<FeatureFlag>,
    private readonly overridesService: OverridesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createFeatureFlagDto: CreateFeatureFlagDto) {
    // Check for duplicate name (name must be globally unique)
    const existing = await this.repository.findOneBy({
      name: createFeatureFlagDto.name,
    });
    if (existing) {
      throw new ConflictException(
        `Feature flag with name '${createFeatureFlagDto.name}' already exists`,
      );
    }

    const result = await this.repository.create(
      createFeatureFlagDto as FeatureFlag,
    );
    const flag = new FeatureFlag(result);

    this.eventEmitter.emit(
      FEATURE_FLAG_EVENTS.CREATED,
      new FeatureFlagCreatedEvent(flag),
    );
    return flag;
  }

  async findAll() {
    const results = await this.repository.findAll();
    const flags = results.map((flag) => new FeatureFlag(flag));
    return flags;
  }

  async findOne(id: string) {
    const result = await this.repository.findOneBy({ _id: new ObjectId(id) });
    if (result) {
      return new FeatureFlag(result);
    }
    return null;
  }

  async update(id: string, updateFeatureFlagDto: UpdateFeatureFlagDto) {
    // If name is being updated, check for conflicts
    if (updateFeatureFlagDto.name) {
      const existing = await this.repository.findOneBy({
        name: updateFeatureFlagDto.name,
      });
      if (existing && existing._id?.toString() !== id) {
        throw new ConflictException(
          `Feature flag with name '${updateFeatureFlagDto.name}' already exists`,
        );
      }
    }

    const result = await this.repository.updateOneBy(
      { _id: new ObjectId(id) },
      updateFeatureFlagDto as Partial<FeatureFlag>,
    );

    const flag = result ? new FeatureFlag(result) : null;

    if (flag) {
      this.eventEmitter.emit(
        FEATURE_FLAG_EVENTS.UPDATED,
        new FeatureFlagUpdatedEvent(flag),
      );
    }
    
    return flag;
  }

  async remove(id: string) {
    const result = await this.repository.deleteOneBy({ _id: new ObjectId(id) });

    const flag = result ? new FeatureFlag(result) : null;

    if (flag) {
      this.eventEmitter.emit(
        FEATURE_FLAG_EVENTS.DELETED,
        new FeatureFlagDeletedEvent(flag),
      );
    }

    return flag;
  }

  async resolveForUser(environment: string, userId: string) {
    const [flags, overrides] = await Promise.all([
      this.findAll(),
      this.overridesService.findByEnvironmentForUser(environment, userId),
    ]);

    return flags.map((flag) => {
      const flagId = flag._id!.toString();

      // User-specific override takes priority over environment-wide override
      const userOverride = overrides.find(
        (o) => o.flagId === flagId && o.userId === userId,
      );
      const envOverride = overrides.find(
        (o) => o.flagId === flagId && !o.userId,
      );

      const override = userOverride ?? envOverride;

      return new FeatureFlag({
        ...flag,
        enabled: override?.enabled ?? flag.enabled,
      });
    });
  }
}
