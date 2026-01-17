import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ObjectId } from 'mongodb';
import { MongoRepository } from '../mongo-connection/mongo.repository';
import { CreateOverrideAsUserDto } from './dto/create-override-as-user.dto';
import { CreateOverrideDto } from './dto/create-override.dto';
import { UpdateOverrideAsUserDto } from './dto/update-override-as-user.dto';
import { UpdateOverrideDto } from './dto/update-override.dto';
import { Override } from './entities/override.entity';
import {
  OVERRIDE_EVENTS,
  OverrideCreatedEvent,
  OverrideDeletedEvent,
  OverrideUpdatedEvent,
} from './events/override.events';

@Injectable()
export class OverridesService {
  constructor(
    private readonly repository: MongoRepository<Override>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== ADMIN METHODS ====================

  async create(createOverrideDto: CreateOverrideDto) {
    const result = await this.repository.create(createOverrideDto as Override);
    const override = new Override(result);

    this.eventEmitter.emit(
      OVERRIDE_EVENTS.CREATED,
      new OverrideCreatedEvent(override),
    );

    return override;
  }

  async findAll() {
    const overrides = await this.repository.findAll();
    return overrides.map((override) => new Override(override));
  }

  async findOne(id: string) {
    const override = await this.repository.findOneBy({ _id: new ObjectId(id) });
    return override ? new Override(override) : null;
  }

  async update(id: string, updateOverrideDto: UpdateOverrideDto) {
    const result = await this.repository.updateOneBy(
      { _id: new ObjectId(id) },
      updateOverrideDto as Partial<Override>,
    );

    const override = result ? new Override(result) : null;

    if (override) {
      this.eventEmitter.emit(
        OVERRIDE_EVENTS.UPDATED,
        new OverrideUpdatedEvent(override),
      );
    }

    return override;
  }

  async remove(id: string) {
    const result = await this.repository.deleteOneBy({
      _id: new ObjectId(id),
    });

    const override = result ? new Override(result) : null;

    if (override) {
      this.eventEmitter.emit(
        OVERRIDE_EVENTS.DELETED,
        new OverrideDeletedEvent(override),
      );
    }

    return override;
  }

  // ==================== USER-SCOPED METHODS ====================

  async findAllByUserId(userId: string) {
    const overrides = await this.repository.findBy({ userId });
    return overrides.map((override) => new Override(override));
  }

  async findOneByIdAndUserId(id: string, userId: string) {
    const override = await this.repository.findOneBy({
      _id: new ObjectId(id),
      userId,
    });
    return override ? new Override(override) : null;
  }

  async createForUser(createDto: CreateOverrideAsUserDto, userId: string) {
    const override = await this.repository.create({
      ...createDto,
      userId,
    } as Override);
    return new Override(override);
  }

  async updateByIdAndUserId(
    id: string,
    updateDto: UpdateOverrideAsUserDto,
    userId: string,
  ) {
    const override = await this.repository.updateOneBy(
      { _id: new ObjectId(id), userId },
      updateDto as Partial<Override>,
    );
    return override ? new Override(override) : null;
  }

  async removeByIdAndUserId(id: string, userId: string) {
    const override = await this.repository.deleteOneBy({
      _id: new ObjectId(id),
      userId,
    });
    return override ? new Override(override) : null;
  }

  async findByEnvironmentForUser(environment: string, userId: string) {
    // Get user-specific overrides
    const userOverrides = await this.repository.findBy({
      environment,
      userId,
    });

    // Get environment-wide overrides (no userId set)
    const envOverrides = await this.repository.findBy({
      environment,
      userId: undefined,
    } as Partial<Override>);

    return [...userOverrides, ...envOverrides].map(
      (override) => new Override(override),
    );
  }
}
