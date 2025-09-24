import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FriendsService } from './services/friends.service';
import { InteractionService } from '../../common/services/interaction.service';
import { ProfileInteraction } from '../user/entities/profile/profile-interaction.entity';
import { Match } from '../../common/entities/match.entity';
import { User } from '../user/entities/user/user.entity';
import { FocusedIntention } from './entities/focused-intention.entity';
import { FocusedIntentionCategory } from './entities/focused-intention-category';
import { FriendProfile } from './entities/friend.profile';
import { FriendFilter } from './entities/friend.filter';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../../system/notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { ActivityModule } from '../activity/activity.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { FriendController } from './friend.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ProfileInteraction,
      Match,
      User,
      FocusedIntention,
      FocusedIntentionCategory,
      FriendProfile,
      FriendFilter,
    ]),
    AuthModule,
    NotificationModule,
    ChatModule,
    ActivityModule,
    SubscriptionModule,
  ],
  controllers: [FriendController],
  providers: [FriendsService, InteractionService],
  exports: [FriendsService, InteractionService],
})
export class FriendsModule {}
