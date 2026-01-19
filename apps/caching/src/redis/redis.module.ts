import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (appConfigService: AppConfigService) => {
        return new Redis(appConfigService.redisUrl);
      },
      inject: [AppConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
