import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';
import { RedisModule } from '../redis/redis.module';
import { CacheInvalidationListener } from './cache-invalidation.listener';

@Module({
  imports: [
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [AppConfigModule],
      useFactory: (appConfig: AppConfigService) => ({
        stores: [
          new Keyv({
            store: new KeyvRedis(appConfig.redisUrl),
          }),
        ],
        ttl: appConfig.cacheTtl,
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [CacheInvalidationListener],
})
export class AppCachingModule {}
