import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionController } from './controllers/subscription.controller';
import { WebhookService } from './services/webhook-subscription.service';
import { WebhookController } from './controllers/webhook-subscription.controller';
import { SubscriptionAnalyticsService } from './services/analytics-subscription.service';
import { SubscriptionAnalyticsController } from './controllers/analytics-subscription.controller';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';
import { FriendProfile } from 'src/feature/friends/entities/friend.profile';
import { SubscriptionHistory } from './entities/subscription-history.entity';
import { AuthModule } from 'src/feature/auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      User,
      DatingProfile,
      FriendProfile,
      SubscriptionHistory,
    ]),
    AuthModule,
  ],
  controllers: [
    SubscriptionController,
    WebhookController,
    SubscriptionAnalyticsController,
  ],
  providers: [
    SubscriptionService,
    WebhookService,
    SubscriptionAnalyticsService,
  ],
  exports: [SubscriptionService, WebhookService, SubscriptionAnalyticsService],
})
export class SubscriptionModule {}
