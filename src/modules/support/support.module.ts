import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportChat, SupportChatSchema } from './entities/support-chat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportChat.name, schema: SupportChatSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
