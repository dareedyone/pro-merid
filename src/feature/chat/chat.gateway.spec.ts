import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server } from 'socket.io';
import { type AuthenticatedSocket, ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../../system/notification/notification.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityTrackerService } from '../activity/activity-tracker.service';
import { RedisService } from '../../system/cache/redis.service';
import type { SendMessageDto } from './dto/send-message.dto';
import { MessageType } from './entities/message.entity';

type MockSocket = Omit<Partial<AuthenticatedSocket>, 'handshake'> & {
  id: string;
  handshake: {
    auth: {
      token: string;
    };
    headers?: Record<string, string | string[] | undefined>;
  };
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  to: jest.Mock;
  disconnect: jest.Mock;
};

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: any;
  let chatService: any;
  let authService: any;
  let notificationService: any;
  let activityService: any;
  let activityTrackerService: any;
  let redisService: any;
  let mockServer: any;
  let mockSocket: MockSocket;

  const mockUserId = 'user-123';
  const mockUserProfileId = 'profile-123';

  function createMockSocket(): MockSocket {
    return {
      id: 'socket-123',
      handshake: {
        auth: {
          token: 'mock-jwt-token',
        },
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      data: {},
      disconnect: jest.fn(),
    };
  }

  function asAuthenticatedSocket(socket: MockSocket): AuthenticatedSocket {
    return socket as unknown as AuthenticatedSocket;
  }

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    mockSocket = createMockSocket();

    const mockJwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'auth-123' }),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'auth-123' }),
    };

    const mockChatService = {
      sendMessage: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
      replyToMessage: jest.fn(),
      getChatInternal: jest.fn(),
      getChats: jest.fn().mockResolvedValue({ chats: [] }),
    };

    const mockAuthService = {
      fetchAuthUser: jest.fn().mockResolvedValue({
        user: { id: mockUserId },
      }),
    };

    const mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockActivityService = {
      updateLastSeen: jest.fn().mockResolvedValue(undefined),
    };

    const mockActivityTrackerService = {
      trackUserOnline: jest.fn().mockResolvedValue(undefined),
      trackUserOffline: jest.fn().mockResolvedValue(undefined),
      resetActivityTracker: jest.fn().mockResolvedValue(undefined),
    };

    const mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      hSet: jest.fn().mockResolvedValue(undefined),
      hGetAll: jest.fn().mockResolvedValue({}),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
        {
          provide: ActivityTrackerService,
          useValue: mockActivityTrackerService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get(JwtService);
    chatService = module.get(ChatService);
    authService = module.get(AuthService);
    notificationService = module.get(NotificationService);
    activityService = module.get(ActivityService);
    activityTrackerService = module.get(ActivityTrackerService);
    redisService = module.get(RedisService);

    // Set the server mock
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate and connect user', async () => {
      mockSocket.handshake.auth.token = 'valid-token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'auth-123' });
      authService.fetchAuthUser.mockResolvedValue({
        user: { id: mockUserId, datingProfile: { id: mockUserProfileId } },
      });

      await gateway.handleConnection(asAuthenticatedSocket(mockSocket));

      expect(jwtService.verifyAsync).toHaveBeenCalled();
      expect(authService.fetchAuthUser).toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${mockUserId}`);
      expect(activityService.updateLastSeen).toHaveBeenCalled();
    });

    it('should disconnect on authentication failure', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(asAuthenticatedSocket(mockSocket));

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should register a disconnection timer for the user', async () => {
      jest.useFakeTimers();

      try {
        mockSocket.userId = mockUserId;
        mockSocket.userProfileId = mockUserProfileId;

        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

        await gateway.handleDisconnect(asAuthenticatedSocket(mockSocket));

        expect(setTimeoutSpy).toHaveBeenCalledWith(
          expect.any(Function),
          60_000,
        );
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    });
  });

  describe('handleSendMessage', () => {
    it('should send a message successfully', async () => {
      const sendMessageDto: SendMessageDto = {
        chatId: 'chat-123',
        text: 'Hello',
        type: MessageType.TEXT,
      };

      mockSocket.userId = mockUserId;
      mockSocket.userProfileId = mockUserProfileId;

      const mockMessage = {
        id: 'msg-123',
        content: 'Hello',
        senderId: mockUserId,
      };

      chatService.sendMessage.mockResolvedValue(mockMessage);

      // The method is decorated with @SubscribeMessage, so we call it directly
      await gateway.handleSendMessage(
        asAuthenticatedSocket(mockSocket),
        sendMessageDto,
      );

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        sendMessageDto,
        mockUserId,
        mockUserProfileId,
      );
    });
  });
});
