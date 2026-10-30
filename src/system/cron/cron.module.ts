import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EmailSchedulerService } from './email-scheduler.service';
import { MatchExpiryService } from './dep_match-expiry.service';
import { ActivityModule } from '../../feature/activity/activity.module';
import { QueueModule } from '../queue/queue.module';
import { ChatModule } from '../../feature/chat/chat.module';
import { NotificationModule } from '../notification/notification.module';
import { ProfileInteraction } from '../../feature/user/entities/profile/profile-interaction.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MikroOrmModule.forFeature([ProfileInteraction]),
    ActivityModule,
    QueueModule,
    forwardRef(() => ChatModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [EmailSchedulerService, MatchExpiryService],
  exports: [EmailSchedulerService, MatchExpiryService],
})
export class CronModule {}
