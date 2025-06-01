import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendEMailCodeDto, VerifyEMailCodeDto } from './dto/email.dto';
import { OAuthSignInDto } from './dto/oauth-signin.dto';

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
    return this.authService.verifyEmailCode(dto);
  }

  @Post('oauth')
  async loginGoogle(@Body(new ValidationPipe()) dto: OAuthSignInDto) {
    return this.authService.oauthLogin(dto);
  }

  // todo: queue welcome email on user creation - not auth creation
}
