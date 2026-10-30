import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Auth } from 'src/feature/auth/entities/auth.entity';
import { Match } from 'src/common/entities/match.entity';
import { Chat } from 'src/feature/chat/entities/chat.entity';
import { DatingModule } from 'src/feature/dating/dating.module';
import { AnchorService } from './services/anchor.service';
import { AnchorUserService } from './services/anchor-user.service';
import { AnchorController } from './controllers/anchor.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Anchor, User, Auth, Match, Chat]),
    DatingModule,
  ],
  providers: [AnchorService, AnchorUserService],
  controllers: [AnchorController],
  exports: [AnchorService, AnchorUserService],
})
export class AnchorModule {}
