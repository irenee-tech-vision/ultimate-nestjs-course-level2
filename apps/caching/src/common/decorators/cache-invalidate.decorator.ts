import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATE_KEY = 'CACHE_INVALIDATE_KEY';

// Supports static keys or dynamic key functions
export type CacheKeyFactory = (request: any) => string[];

export const CacheInvalidate = (...keys: (string | CacheKeyFactory)[]) =>
  SetMetadata(CACHE_INVALIDATE_KEY, keys);
