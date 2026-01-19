import {
  Inject,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import {
  seedFeatureFlags,
  createFeatureFlags,
} from '../../test/fixtures/feature-flags.fixtures';
import { seedStaticOverrides } from '../../test/fixtures/overrides.fixtures';
import { seedUsers } from '../../test/fixtures/users.fixtures';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';
import { MONGO_CLIENT_TOKEN, MONGO_DB_TOKEN } from './mongo.constants';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: MONGO_CLIENT_TOKEN,
      useFactory: (appConfigService: AppConfigService) =>
        new MongoClient(appConfigService.mongoUri),
      inject: [AppConfigService],
    },
    {
      provide: MONGO_DB_TOKEN,
      useFactory: async (mongoClient: MongoClient) => {
        await mongoClient.connect();
        return mongoClient.db();
      },
      inject: [MONGO_CLIENT_TOKEN],
    },
  ],
  exports: [MONGO_DB_TOKEN],
})
export class MongoCoreModule implements OnApplicationShutdown, OnModuleInit {
  constructor(
    @Inject(MONGO_CLIENT_TOKEN)
    private readonly mongoClient: MongoClient,
    @Inject(MONGO_DB_TOKEN)
    private readonly db: Db,
    private readonly appConfigService: AppConfigService,
  ) {}

  async onModuleInit() {
    if (this.appConfigService.seedData) {
      const [featureFlags, users, overrides] = await Promise.all([
        this.insertSeedFeatureFlags(),
        this.insertSeedUsers(),
        this.insertSeedOverrides(),
      ]);

      console.log('Seeded data successfully');
      console.log(`Seeded ${featureFlags.insertedCount} feature flags`);
      console.log(`Seeded ${users.insertedCount} users`);
      console.log(`Seeded ${overrides.insertedCount} overrides`);
    }
  }

  onApplicationShutdown() {
    console.log('Closing mongo connection');
    this.mongoClient.close();
  }

  private async insertSeedFeatureFlags() {
    console.log('Seeding feature flags...');
    const featureFlags = seedFeatureFlags();
    const otherFeatureFlags = createFeatureFlags();
    await this.db.collection('feature_flags').deleteMany({});
    const result = await this.db
      .collection('feature_flags')
      .insertMany([...featureFlags, ...otherFeatureFlags]);

    return result;
  }

  private async insertSeedOverrides() {
    console.log('Seeding overrides...');
    const overrides = seedStaticOverrides();
    await this.db.collection('overrides').deleteMany({});
    const result = await this.db.collection('overrides').insertMany(overrides);
    return result;
  }

  private async insertSeedUsers() {
    console.log('Seeding users...');
    await this.db.collection('users').deleteMany({});
    const result = await this.db.collection('users').insertMany(seedUsers);

    return result;
  }
}
