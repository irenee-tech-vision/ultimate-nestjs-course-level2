import { DynamicModule, Module } from '@nestjs/common';
import { MongoCoreModule } from './mongo-core.module';
import { MongoRepository } from './mongo.repository';
import { REPOSITORY_COLLECTION_NAME_TOKEN } from './mongo.constants';

@Module({})
export class MongoConnectionModule {
  static forRoot(): DynamicModule {
    return {
      module: MongoConnectionModule,
      global: true,
      imports: [MongoCoreModule],
      exports: [MongoCoreModule],
    };
  }

  static forFeature(options: { collectionName: string }): DynamicModule {
    return {
      module: MongoConnectionModule,
      providers: [
        MongoRepository,
        {
          provide: REPOSITORY_COLLECTION_NAME_TOKEN,
          useValue: options.collectionName,
        },
      ],
      exports: [MongoRepository],
    };
  }
}
