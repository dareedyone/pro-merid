import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class JobContextService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  private buildKey(namespace: string, jobId: string): string {
    return `jobctx:${namespace}:${jobId}`;
  }

  async set<T extends object>(
    namespace: string,
    jobId: string,
    data: Partial<T>,
    ttl = 1000 * 60 * 24 * 7, // 7 days
  ): Promise<void> {
    const key = this.buildKey(namespace, jobId);
    const current = (await this.cache.get<T>(key)) || ({} as T);
    await this.cache.set(key, { ...current, ...data }, ttl);
  }

  async get<T>(namespace: string, jobId: string): Promise<T | null> {
    return await this.cache.get<T>(this.buildKey(namespace, jobId));
  }

  async delete(namespace: string, jobId: string): Promise<void> {
    await this.cache.del(this.buildKey(namespace, jobId));
  }
}
