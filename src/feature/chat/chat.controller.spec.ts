import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MediaService } from './media.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const mockChatService = {
      createChat: jest.fn(),
      initiateCall: jest.fn(),
      answerCall: jest.fn(),
    };

    const mockMediaService = {
      uploadMedia: jest.fn(),
    };

    const mockAuthService = {
      fetchAuthUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
