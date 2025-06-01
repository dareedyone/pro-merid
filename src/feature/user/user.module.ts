import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Auth } from '../auth/entities/auth.entity';
import { User } from './entities/user/user.entity';
import { Anchor } from './entities/user/anchor.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Auth, User, Anchor])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
