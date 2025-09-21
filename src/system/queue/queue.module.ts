import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email/email.queue';
import {
  EMAIL_QUEUE,
  MEDIA_QUEUE,
  ACTIVITY_QUEUE,
  NOTIFICATION_QUEUE,
} from './const/queue';
import { EmailQueueService } from './email/email.qservice';
import { MediaQueueService } from './media/media.qservice';
import { ActivityQueueService } from './activity/activity.qservice';
import { ActivityQueueWorker } from './activity/activity.queue';
import { ActivityProcessor } from './activity/activity.processor';
import { NotificationQueueService } from './notification/notification.qservice';
import { NotificationQueueWorker } from './notification/notification.queue';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';
import { AwsModule } from '../aws/aws.module';
import { S3Service } from '../aws/s3.service';
import { RekognitionService } from '../aws/rekognition.service';
import { MediaProcessor } from './media/media.queue';
import { JobContextService } from './job-context.service';
import { ActivityModule } from '../../feature/activity/activity.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileInteraction } from '../../feature/user/entities/profile/profile-interaction.entity';

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
      {
        name: ACTIVITY_QUEUE,
      },
      {
        name: NOTIFICATION_QUEUE,
      },
    ),
    MikroOrmModule.forFeature([ProfileInteraction]),
    EmailModule,
    AwsModule,
    ActivityModule,
    RedisCacheModule,
  ],
  providers: [
    JobContextService,
    EmailProcessor,
    MediaProcessor,
    ActivityQueueWorker,
    ActivityProcessor,
    NotificationQueueWorker,
    EmailQueueService,
    MediaQueueService,
    ActivityQueueService,
    NotificationQueueService,
    EmailService,
    S3Service,
    RekognitionService,
  ],
  exports: [
    EmailQueueService,
    MediaQueueService,
    ActivityQueueService,
    NotificationQueueService,
    JobContextService,
  ],
})
export class QueueModule {}
