import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MongoConnectionModule } from './mongo-connection/mongo-connection.module';
import { OverridesModule } from './overrides/overrides.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CachingController } from './caching.controller';
import { AppConfigModule } from './app-config/app-config.module';
import { AppConfigService } from './app-config/app-config.service';

const CLIENT_ROOT_PATH = join(
  __dirname,
  '../../..',
  'apps',
  'caching',
  'client',
);

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [AppConfigModule],
      useFactory: (appConfig: AppConfigService) => ({
        ttl: appConfig.cacheTtl,
      }),
      inject: [AppConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: CLIENT_ROOT_PATH,
    }),
    MongoConnectionModule.forRoot(),
    FeatureFlagsModule,
    OverridesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [CachingController],
  providers: [],
})
export class CachingModule {}
