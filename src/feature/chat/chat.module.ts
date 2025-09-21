import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MediaService } from './media.service';
import { SubscriptionLimitsService } from './subscription-limits.service';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { AuthModule } from '../auth/auth.module';
import { ActivityModule } from '../activity/activity.module';
import { CronModule } from '../../system/cron/cron.module';
import { RedisCacheModule } from '../../system/cache/redis-cache.module';
import { NotificationModule } from '../../system/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    AuthModule,
    ActivityModule,
    CronModule,
    RedisCacheModule,
    NotificationModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    MediaService,
    SubscriptionLimitsService,
  ],
  exports: [ChatService, ChatGateway, MediaService, SubscriptionLimitsService],
})
export class ChatModule {}
