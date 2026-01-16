import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get mongoUri(): string {
    return this.configService.get<string>('MONGO_URI')!;
  }

  get seedData(): boolean {
    return this.configService.get<string>('SEED_DATA') === 'true';
  }

  get cacheTtl(): number {
    return Number(this.configService.get<string>('CACHE_TTL'));
  }
}
