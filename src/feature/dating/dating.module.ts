import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DatingService } from './dating.service';
import { InteractionService } from '../../common/services/interaction.service';
import { MatchTimerService } from './match-timer.service';
import { NotificationModule } from '../../system/notification/notification.module';
import { ActivityModule } from '../activity/activity.module';
import { DatingController } from './dating.controller';
import { User } from '../user/entities/user/user.entity';
import { DatingProfile } from './entities/dating.profile';
import { ProfileInteraction } from '../user/entities/profile/profile-interaction.entity';
import { Match } from '../../common/entities/match.entity';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, DatingProfile, ProfileInteraction, Match]),
    AuthModule,
    ChatModule,
    NotificationModule,
    ActivityModule,
    SubscriptionModule,
  ],
  controllers: [DatingController],
  providers: [DatingService, InteractionService, MatchTimerService],
  exports: [DatingService, InteractionService],
})
export class DatingModule {}
