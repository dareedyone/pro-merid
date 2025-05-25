import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() body: { email: string; password: string }) {
    return this.authService.signUp(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  async googleAuth(@Body() body: { token: string }) {
    return this.authService.validateGoogleToken(body.token);
  }

  @Post('apple')
  async appleAuth(@Body() body: { token: string }) {
    return this.authService.validateAppleToken(body.token);
  }
}
