import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
      {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      },
    );

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return Boolean(result);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds);
    return Boolean(result);
  }

  // Hash operations for efficient user data storage
  async hGet(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.redis.hset(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return await this.redis.hdel(key, ...fields);
  }

  async hExists(key: string, field: string): Promise<boolean> {
    const result = await this.redis.hexists(key, field);
    return Boolean(result);
  }

  async hKeys(key: string): Promise<string[]> {
    return await this.redis.hkeys(key);
  }

  async hLen(key: string): Promise<number> {
    return await this.redis.hlen(key);
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return await this.redis.sadd(key, ...members);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return await this.redis.srem(key, ...members);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member);
    return Boolean(result);
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    return await this.redis.lpush(key, ...values);
  }

  async rPush(key: string, ...values: string[]): Promise<number> {
    return await this.redis.rpush(key, ...values);
  }

  async lPop(key: string): Promise<string | null> {
    return await this.redis.lpop(key);
  }

  async rPop(key: string): Promise<string | null> {
    return await this.redis.rpop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async lLen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }

  // Pipeline operations for batch processing
  async pipeline(): Promise<any> {
    return this.redis.pipeline();
  }

  // Close connection
  async close(): Promise<void> {
    await this.redis.quit();
  }

  // Get the underlying Redis client for advanced operations
  getClient(): Redis {
    return this.redis;
  }
}
