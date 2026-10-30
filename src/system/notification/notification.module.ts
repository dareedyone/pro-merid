import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { UserModule } from '../../feature/user/user.module';
import { ChatModule } from '../../feature/chat/chat.module';
import { CronModule } from '../cron/cron.module';

@Module({
  imports: [
    UserModule,
    forwardRef(() => ChatModule),
    forwardRef(() => CronModule),
  ],
  providers: [NotificationService, PushNotificationService],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationModule {}
