import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { SendTokenDto } from './dto/email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly appleAuthService: AppleAuthService,
  ) {}

  // @Post('signup')
  // async signUp(@Body() body: { email: string; password: string }) {
  //   return this.authService.signUp(body.email, body.password);
  // }

  // @Post('login')
  // async login(@Body() body: { email: string; password: string }) {
  //   return this.authService.login(body.email, body.password);
  // }

  // @Post('google')
  // async googleAuth(@Body() body: { token: string }) {
  //   return this.authService.validateGoogleToken(body.token);
  // }

  // @Post('apple')
  // async appleAuth(@Body() body: { token: string }) {
  //   return this.authService.validateAppleToken(body.token);
  // }

  // @Post('signin')
  // signIn(@Body() dto: SignInDto) {
  //   return this.authService.signIn(dto);
  // }

  // @Post('oauth')
  // oauth(@Body() dto: OAuthSignInDto) {
  //   return this.authService.oauthSignIn(dto);
  // }
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 1, ttl: 60 } })
  @Post('send-code')
  async sendCode(@Body(new ValidationPipe()) sendTokenDto: SendTokenDto) {
    await this.authService.sendEmailCode(sendTokenDto.email);
    return { message: 'Code sent' };
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: { email: string; code: string }) {
    return this.authService.verifyLoginCode(dto.email, dto.code);
  }

  @Post('google')
  async loginGoogle(@Body() dto: { idToken: string }) {
    const payload = await this.googleAuthService.verifyIdToken(dto.idToken);
    return this.authService.loginWithOAuth(
      'google',
      payload.sub,
      payload.email,
    );
  }

  // @Post('apple')
  // async loginApple(@Body() dto: { appleId: string; email?: string }) {
  //   return this.authService.loginWithOAuth('apple', dto.appleId, dto.email);
  // }
  @Post('apple')
  async loginApple(@Body() dto: { idToken: string }) {
    const payload = await this.appleAuthService.verifyIdToken(dto.idToken);
    return this.authService.loginWithOAuth('apple', payload.sub, payload.email);
  }

  // new here
  // @Post('email/request')
  // async requestCode(@Body('email') email: string) {
  //   return this.authService.requestEmailCode(email);
  // }

  // @Post('email/verify')
  // async verifyCode(
  //   @Body('email') email: string,
  //   @Body('code') code: string,
  // ) {
  //   return { token: await this.authService.verifyCode(email, code) };
  // }

  // @Post('oauth')
  // async oauthLogin(
  //   @Body('email') email: string,
  //   @Body('providerId') providerId: string,
  //   @Body('provider') provider: 'google' | 'apple',
  //   @Body('role') role: UserType,
  // ) {
  //   return { token: await this.authService.oauthLogin(email, providerId, provider, role) };
  // }
}
