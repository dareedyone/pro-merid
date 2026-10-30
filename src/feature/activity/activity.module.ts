import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityTrackerService } from './activity-tracker.service';
import { User } from '../user/entities/user/user.entity';
import { Match } from '../../common/entities/match.entity';
import { RedisCacheModule } from '../../system/cache/redis-cache.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { Message, MessageSchema } from '../chat/entities/message.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, Match]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    RedisCacheModule,
    AuthModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityTrackerService],
  exports: [ActivityService, ActivityTrackerService],
})
export class ActivityModule {}
