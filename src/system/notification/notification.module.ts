import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { EmailQueueService } from '../queue/email/email.qservice';
import { UserModule } from '../../feature/user/user.module';
import { ChatModule } from '../../feature/chat/chat.module';
import { CronModule } from '../cron/cron.module';

@Module({
  imports: [UserModule, ChatModule, CronModule],
  providers: [NotificationService, PushNotificationService, EmailQueueService],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationModule {}
