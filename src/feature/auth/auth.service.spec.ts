import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { Anchor } from '../user/entities/user/anchor.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };
  const mockGoogleAuthService = { verifyIdToken: jest.fn() };
  const mockAppleAuthService = { verifyIdToken: jest.fn() };
  const mockEmailQueueService = { sendEmailCode: jest.fn() };
  const mockEm = {
    persistAndFlush: jest.fn(),
  };

  const mockAuthRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockUserRepo = {};
  const mockAnchorRepo = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
        { provide: AppleAuthService, useValue: mockAppleAuthService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: EntityManager, useValue: mockEm },
        { provide: getRepositoryToken(Auth), useValue: mockAuthRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Anchor), useValue: mockAnchorRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email code', async () => {
    mockAuthRepo.findOne.mockResolvedValueOnce(null);
    mockAuthRepo.create.mockReturnValueOnce({
      email: 'test@example.com',
      lastCodeSentAt: new Date(Date.now() - 1000),
    });

    await service.sendEmailCode({ email: 'test@example.com' });

    expect(mockEmailQueueService.sendEmailCode).toHaveBeenCalledWith({
      email: 'test@example.com',
      code: expect.any(String),
    });
  });

  it('should throw if code requested too soon', async () => {
    const now = new Date();
    mockAuthRepo.findOne.mockResolvedValueOnce({
      email: 'test@example.com',
      lastCodeSentAt: now,
    });

    await expect(
      service.sendEmailCode({ email: 'test@example.com' }),
    ).rejects.toThrow('Please wait before requesting another code.');
  });
});
