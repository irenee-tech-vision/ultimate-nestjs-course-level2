import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppCachingModule } from './app-caching/app-caching.module';
import { AuthModule } from './auth/auth.module';
import { CachingController } from './caching.controller';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MongoConnectionModule } from './mongo-connection/mongo-connection.module';
import { OverridesModule } from './overrides/overrides.module';
import { UsersModule } from './users/users.module';

const CLIENT_ROOT_PATH = join(
  __dirname,
  '../../..',
  'apps',
  'caching',
  'client',
);

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: CLIENT_ROOT_PATH,
    }),
    MongoConnectionModule.forRoot(),
    FeatureFlagsModule,
    OverridesModule,
    UsersModule,
    AuthModule,
    AppCachingModule,
  ],
  controllers: [CachingController],
  providers: [],
})
export class CachingModule {}
