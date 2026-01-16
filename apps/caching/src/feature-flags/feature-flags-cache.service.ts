import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagsCacheService {
  private cache = new Map<string, any>();
  private ttlMap = new Map<string, number>();

  get<T>(key: string): T | undefined {
    const expiration = this.ttlMap.get(key);
    if (expiration && Date.now() > expiration) {
      this.del(key);
      return undefined;
    }

    return this.cache.get(key) as T | undefined;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, value);
    if (ttlMs) {
      this.ttlMap.set(key, Date.now() + ttlMs);
    } else {
      this.ttlMap.delete(key);
    }
  }

  del(key: string): void {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.ttlMap.clear();
  }
}
