import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) { }

  get ormOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('ORM_HOST'),
      port: this.configService.get<number>('ORM_PORT'),
      password: this.configService.get<string>('ORM_PASSWORD'),
      username: this.configService.get<string>('ORM_USERNAME'),
      database: this.configService.get<string>('ORM_DATABASE'),
      autoLoadEntities: this.configService.get<boolean>('ORM_AUTO_LOAD_ENTITIES'),
      synchronize: this.configService.get<boolean>('ORM_SYNCHRONIZE'),
    };
  }
}
