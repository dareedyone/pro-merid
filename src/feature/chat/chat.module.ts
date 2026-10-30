import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MediaService } from './media.service';
import { SubscriptionLimitsService } from './subscription-limits.service';
import { AgoraService } from './services/agora.service';
import { WebRTCService } from './services/webrtc.service';
import { CallProviderFactory } from './services/call-provider.factory';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { Call, CallSchema } from './entities/call.entity';
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
      { name: Call.name, schema: CallSchema },
    ]),
    AuthModule,
    forwardRef(() => ActivityModule),
    forwardRef(() => CronModule),
    RedisCacheModule,
    forwardRef(() => NotificationModule), // Still needs forwardRef due to module-level circular dependency
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: 'WEBSOCKET_NOTIFIER',
      useExisting: ChatGateway,
    },
    MediaService,
    SubscriptionLimitsService,
    AgoraService,
    WebRTCService,
    CallProviderFactory,
  ],
  exports: [
    ChatService,
    ChatGateway,
    'WEBSOCKET_NOTIFIER',
    MediaService,
    SubscriptionLimitsService,
  ],
})
export class ChatModule {}
