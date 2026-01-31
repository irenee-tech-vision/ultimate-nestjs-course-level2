import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppConfigModule } from './app-config/app-config.module';
import { AppConfigService } from './app-config/app-config.service';
import { OrdersModule } from './orders/orders.module';

const CLIENT_ROOT_PATH = join(
  __dirname,
  '../../..',
  'apps',
  'payment',
  'client',
);

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: CLIENT_ROOT_PATH,
    }),
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (appConfigService: AppConfigService) => {
        return appConfigService.ormOptions;
      },
      inject: [AppConfigService],
    }),
    OrdersModule,
  ],
})
export class AppModule {}
