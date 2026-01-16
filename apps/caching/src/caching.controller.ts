import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';

@Controller('cache')
export class CachingController {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @Get()
  async findAll() {
    const cacheData: { key: string; value: unknown }[] = [];

    const store = this.cacheManager.stores[0];
    if (store?.iterator) {
      for await (const [key, value] of store.iterator({})) {
        cacheData.push({ key, value });
      }
    }

    return cacheData;
  }
}
