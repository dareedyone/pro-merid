import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
// import { Keyv } from 'keyv';
import { CacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          store: createKeyv(
            configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
          ),
          ttl: 60 * 5,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}
