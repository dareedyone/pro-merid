import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { Anchor } from '../anchor/entities/anchor.entity';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';

@Module({
  imports: [MikroOrmModule.forFeature([Auth, User, Anchor])],
  providers: [AuthService, GoogleAuthService, AppleAuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
