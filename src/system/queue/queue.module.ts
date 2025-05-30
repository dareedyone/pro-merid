import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email/email.processor';
import { EMAIL_QUEUE } from './queue.constant';
import { EmailQueueService } from './email/email.queue';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: EMAIL_QUEUE,
      },
      // {
      //   name: EMAIL_QUEUE,
      // },
    ),
    EmailModule,
  ],
  providers: [EmailProcessor, EmailQueueService, EmailService],
  exports: [EmailQueueService],
})
export class QueueModule {}
