import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      sendEmailCode: jest.fn(),
      verifyEmailCode: jest.fn().mockResolvedValue({ access_token: 'abc' }),
      oauthLogin: jest.fn().mockResolvedValue({ access_token: 'xyz' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send email code', async () => {
    await expect(
      controller.sendCode({ email: 'test@example.com' }),
    ).resolves.toEqual({ message: 'Code sent to email successfully' });

    expect(mockAuthService.sendEmailCode).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('should verify code and return token', async () => {
    const result = await controller.verifyCode({
      email: 'test@example.com',
      code: '123456',
    });

    expect(result).toEqual({ message: 'Code verified successfully', access_token: 'abc' });
    expect(mockAuthService.verifyEmailCode).toHaveBeenCalled();
  });

  it('should handle OAuth login', async () => {
    const result = await controller.loginOauth({
      provider: 'google',
      idToken: 'fake-google-token',
    });

    expect(result).toEqual({ message: 'OAuth login successful', access_token: 'xyz' });
    expect(mockAuthService.oauthLogin).toHaveBeenCalled();
  });
});
