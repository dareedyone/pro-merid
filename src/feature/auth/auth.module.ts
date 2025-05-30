import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { JWT_SECRET } from 'src/common/common.contant';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { Anchor } from '../user/entities/user/anchor.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>(JWT_SECRET) || 'supersecret',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
    MikroOrmModule.forFeature([Auth, User, Anchor]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  // exports: [AuthService],
})
export class AuthModule {}
// Security & Production Notes
// Store JWT_SECRET in .env

// Rate-limit auth endpoints

// Consider email domain whitelisting if necessary

// Add OAuth callback support if integrating Google/Apple login flows fully

// Use guards (@UseGuards(JwtAuthGuard)) in protected routes
