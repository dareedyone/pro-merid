import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email/email.queue';
import { EMAIL_QUEUE, MEDIA_QUEUE } from './const/queue';
import { EmailQueueService } from './email/email.qservice';
import { MediaQueueService } from './media/media.qservice';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';
import { AwsModule } from '../aws/aws.module';
import { S3Service } from '../aws/s3.service';
import { RekognitionService } from '../aws/rekognition.service';
import { MediaProcessor } from './media/media.queue';
import { JobContextService } from './job-context.service';

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
      {
        name: MEDIA_QUEUE,
      },
    ),
    EmailModule,
    AwsModule,
  ],
  providers: [
    JobContextService,
    EmailProcessor,
    MediaProcessor,
    EmailQueueService,
    EmailService,
    S3Service,
    RekognitionService,
  ],
  exports: [EmailQueueService, MediaQueueService, JobContextService],
})
export class QueueModule {}
