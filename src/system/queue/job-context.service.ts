import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class JobContextService {
  constructor(private readonly redis: RedisService) {}

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
    const currentJson = await this.redis.get(key);
    const current = currentJson ? JSON.parse(currentJson) : ({} as T);
    const updated = { ...current, ...data };
    await this.redis.set(key, JSON.stringify(updated), ttl);
  }

  async get<T>(namespace: string, jobId: string): Promise<T | null> {
    const key = this.buildKey(namespace, jobId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async delete(namespace: string, jobId: string): Promise<void> {
    const key = this.buildKey(namespace, jobId);
    await this.redis.del(key);
  }
}
