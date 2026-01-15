import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoRepository } from '../mongo-connection/mongo.repository';
import { CreateOverrideDto } from './dto/create-override.dto';
import { CreateOverrideAsUserDto } from './dto/create-override-as-user.dto';
import { UpdateOverrideDto } from './dto/update-override.dto';
import { UpdateOverrideAsUserDto } from './dto/update-override-as-user.dto';
import { Override } from './entities/override.entity';

@Injectable()
export class OverridesService {
  constructor(private readonly repository: MongoRepository<Override>) {}

  // ==================== ADMIN METHODS ====================

  async create(createOverrideDto: CreateOverrideDto) {
    const override = await this.repository.create(createOverrideDto as Override);
    return new Override(override);
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
    const override = await this.repository.updateOneBy(
      { _id: new ObjectId(id) },
      updateOverrideDto as Partial<Override>,
    );
    return override ? new Override(override) : null;
  }

  async remove(id: string) {
    const override = await this.repository.deleteOneBy({
      _id: new ObjectId(id),
    });
    return override ? new Override(override) : null;
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
