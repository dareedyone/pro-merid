import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendEMailCodeDto, VerifyEMailCodeDto } from './dto/email.dto';
import { OAuthSignInDto } from './dto/oauth-signin.dto';
import { PushTokenDto } from './dto/push-token.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserType } from 'src/common/types/enums/user.enum';
import { Roles } from 'src/common/guards/roles.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 1, ttl: 60 } })
  @Post('send-code')
  async sendCode(@Body(new ValidationPipe()) dto: SendEMailCodeDto) {
    await this.authService.sendEmailCode(dto);
    return { message: 'Code sent to email successfully' };
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyEMailCodeDto) {
    const data = await this.authService.verifyEmailCode(dto);
    return {
      message: 'Code verified successfully',
      ...data,
    };
  }

  @Post('oauth')
  async loginOauth(@Body(new ValidationPipe()) dto: OAuthSignInDto) {
    const data = await this.authService.oauthLogin(dto);
    return {
      message: 'OAuth login successful',
      ...data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.USER)
  @Post('push-token')
  savePushToken(@Req() req: Request, @Body() pushTokenDto: PushTokenDto) {
    const authId = req?.user?.sub;
    return this.authService.updatePushToken(authId, pushTokenDto);
  }
}
