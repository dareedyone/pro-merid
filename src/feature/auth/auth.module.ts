import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// import { ConfigService } from '@nestjs/config';
// import { JWT_SECRET } from 'src/common/common.contant';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { Anchor } from '../anchor/entities/anchor.entity';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';

@Module({
  imports: [
    // JwtModule.registerAsync({
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     global: true,
    //     secret: config.get<string>(JWT_SECRET) || 'supersecret',
    //     signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
    //   }),
    // }),
    MikroOrmModule.forFeature([Auth, User, Anchor]),
  ],
  providers: [
    AuthService,
    GoogleAuthService,
    AppleAuthService,
    EmailQueueService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
