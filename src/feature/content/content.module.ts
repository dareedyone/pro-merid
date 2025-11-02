import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './controllers/content.controller';
import { AdminContentController } from './controllers/admin-content.controller';
import { Blog, BlogSchema } from './entities/blog.entity';
import { Event, EventSchema } from './entities/event.entity';
import {
  SuccessStory,
  SuccessStorySchema,
} from './entities/success-story.entity';
import { NotificationModule } from '../../system/notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '../user/entities/user/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Event.name, schema: EventSchema },
      { name: SuccessStory.name, schema: SuccessStorySchema },
    ]),
    MikroOrmModule.forFeature([User]),
    NotificationModule,
    AuthModule,
  ],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
