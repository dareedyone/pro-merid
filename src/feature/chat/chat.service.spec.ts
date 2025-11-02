import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat, ChatDocument, ChatStatus } from './entities/chat.entity';
import { Call, CallDocument, CallStatus, CallType } from './entities/call.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { SubscriptionLimitsService } from './subscription-limits.service';
import { CallProviderFactory } from './services/call-provider.factory';
import { NotificationService, NotificationType } from '../../system/notification/notification.service';
import { AuthService } from '../auth/auth.service';
import { InitiateCallDto, AnswerCallDto, EndCallDto } from './dto/call.dto';

describe('ChatService', () => {
  let service: ChatService;
  let chatModel: any;
  let callModel: any;
  let messageModel: any;
  let subscriptionLimitsService: any;
  let callProviderFactory: any;
  let notificationService: any;
  let authService: any;

  const mockAuthId = '123456789';
  const mockUserId = 'user-123';
  const mockCallerProfileId = 'profile-123';
  const mockChatId = 'chat-123';
  const mockCallId = 'call-123';

  const mockUser = {
    id: mockUserId,
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockChat = {
    _id: mockChatId,
    participantIds: [mockUserId, 'user-456'],
    profileIds: [mockCallerProfileId, 'profile-456'],
    status: ChatStatus.ACTIVE,
    avatar: 'avatar-url',
    name: 'Test Chat',
  };

  const mockCallProvider = {
    getProviderType: jest.fn().mockReturnValue('agora'),
    generateChannelName: jest.fn().mockReturnValue('chat_chat123_1234567890'),
    generateToken: jest.fn().mockResolvedValue({
      token: 'mock-token',
      channelName: 'chat_chat123_1234567890',
      uid: 123456789,
    }),
    isConfigured: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    // Mock Mongoose models
    const mockChatModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      new: jest.fn(),
    };

    // callModel is used as a constructor, so we need a function that returns an object
    const mockCallModel = jest.fn((data) => ({
      ...data,
      _id: mockCallId,
      save: jest.fn().mockResolvedValue(undefined),
    })) as jest.MockedFunction<any>;
    (mockCallModel as any).findOne = jest.fn();
    (mockCallModel as any).find = jest.fn();
    (mockCallModel as any).create = jest.fn();

    const mockMessageModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      new: jest.fn(),
    };

    // Mock services
    const mockSubscriptionLimitsService = {
      getSubscriptionLimits: jest.fn().mockReturnValue({}),
      checkChatLimit: jest.fn().mockResolvedValue(undefined),
    };

    const mockCallProviderFactory = {
      getProvider: jest.fn().mockReturnValue(mockCallProvider),
      getAvailableProviders: jest.fn().mockReturnValue({
        agora: { available: true, configured: true },
      }),
    };

    const mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockAuthService = {
      fetchAuthUser: jest.fn().mockResolvedValue({ user: mockUser }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Chat.name),
          useValue: mockChatModel,
        },
        {
          provide: getModelToken(Call.name),
          useValue: mockCallModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: SubscriptionLimitsService,
          useValue: mockSubscriptionLimitsService,
        },
        {
          provide: CallProviderFactory,
          useValue: mockCallProviderFactory,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    chatModel = module.get(getModelToken(Chat.name));
    callModel = module.get(getModelToken(Call.name));
    messageModel = module.get(getModelToken(Message.name));
    subscriptionLimitsService = module.get(SubscriptionLimitsService);
    callProviderFactory = module.get(CallProviderFactory);
    notificationService = module.get(NotificationService);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateCall', () => {
    const initiateCallDto: InitiateCallDto = {
      chatId: mockChatId,
      type: CallType.AUDIO,
    };

    it('should throw NotFoundException when chat does not exist', async () => {
      chatModel.findOne.mockResolvedValue(null);

      await expect(
        service.initiateCall(
          initiateCallDto,
          mockAuthId,
          mockCallerProfileId,
          false,
          false,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(chatModel.findOne).toHaveBeenCalledWith({
        _id: mockChatId,
        participantIds: { $in: [mockUserId] },
        status: ChatStatus.ACTIVE,
      });
    });

    it('should throw BadRequestException when user is already in a call', async () => {
      chatModel.findOne.mockResolvedValue(mockChat);
      callModel.findOne.mockResolvedValue({
        _id: 'existing-call',
        status: CallStatus.CONNECTED,
      });

      await expect(
        service.initiateCall(
          initiateCallDto,
          mockAuthId,
          mockCallerProfileId,
          false,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(callModel.findOne).toHaveBeenCalledWith({
        participantIds: { $in: [mockUserId] },
        status: {
          $in: [CallStatus.INITIATING, CallStatus.RINGING, CallStatus.CONNECTED],
        },
      });
    });

    it('should successfully initiate a call', async () => {
      chatModel.findOne.mockResolvedValue(mockChat);
      callModel.findOne.mockResolvedValue(null);

      const mockSavedCall = {
        _id: mockCallId,
        chatId: mockChatId,
        callerId: mockUserId,
        callerProfileId: mockCallerProfileId,
        participantIds: mockChat.participantIds,
        participantProfileIds: mockChat.profileIds,
        type: CallType.AUDIO,
        status: CallStatus.INITIATING,
        provider: 'agora',
        channelName: 'chat_chat123_1234567890',
        token: 'mock-token',
        callerUid: 123456789,
        participantUids: new Map([[mockUserId, 123456789]]),
        isRecording: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(mockCallId),
      };

      callModel.mockReturnValue(mockSavedCall);

      const result = await service.initiateCall(
        initiateCallDto,
        mockAuthId,
        mockCallerProfileId,
        false,
        false,
      );

      expect(authService.fetchAuthUser).toHaveBeenCalledWith(mockAuthId);
      expect(chatModel.findOne).toHaveBeenCalledWith({
        _id: mockChatId,
        participantIds: { $in: [mockUserId] },
        status: ChatStatus.ACTIVE,
      });
      expect(callProviderFactory.getProvider).toHaveBeenCalled();
      expect(mockCallProvider.generateChannelName).toHaveBeenCalledWith(mockChatId);
      expect(mockCallProvider.generateToken).toHaveBeenCalledWith(
        'chat_chat123_1234567890',
        mockAuthId,
      );
      expect(callModel).toHaveBeenCalled();
      expect(mockSavedCall.save).toHaveBeenCalled();
      expect(result.channelName).toBe('chat_chat123_1234567890');
      expect(result.token).toBe('mock-token');
      expect(result.callerUid).toBe(123456789);
    });

    it('should send notifications to other participants', async () => {
      chatModel.findOne.mockResolvedValue(mockChat);
      callModel.findOne.mockResolvedValue(null);

      const mockSavedCall = {
        _id: mockCallId,
        chatId: mockChatId,
        callerId: mockUserId,
        callerProfileId: mockCallerProfileId,
        participantIds: mockChat.participantIds,
        participantProfileIds: mockChat.profileIds,
        type: CallType.AUDIO,
        status: CallStatus.INITIATING,
        provider: 'agora',
        channelName: 'chat_chat123_1234567890',
        token: 'mock-token',
        callerUid: 123456789,
        participantUids: new Map([[mockUserId, 123456789]]),
        isRecording: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(mockCallId),
      };

      callModel.mockReturnValue(mockSavedCall);

      await service.initiateCall(
        initiateCallDto,
        mockAuthId,
        mockCallerProfileId,
        false,
        false,
      );

      // Should notify the other participant (user-456)
      expect(notificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-456',
        type: NotificationType.CALL_INCOMING,
        data: {
          callId: mockCallId,
          chatId: mockChatId,
          callType: CallType.AUDIO,
          callerName: 'John Doe',
          callerAvatar: 'avatar-url',
        },
      });

      // Should not notify the caller
      expect(notificationService.sendNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should use caller display name in notifications', async () => {
      chatModel.findOne.mockResolvedValue(mockChat);
      callModel.findOne.mockResolvedValue(null);

      const mockSavedCall = {
        _id: mockCallId,
        chatId: mockChatId,
        callerId: mockUserId,
        callerProfileId: mockCallerProfileId,
        participantIds: mockChat.participantIds,
        participantProfileIds: mockChat.profileIds,
        type: CallType.VIDEO,
        status: CallStatus.INITIATING,
        provider: 'agora',
        channelName: 'chat_chat123_1234567890',
        token: 'mock-token',
        callerUid: 123456789,
        participantUids: new Map([[mockUserId, 123456789]]),
        isRecording: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(mockCallId),
      };

      callModel.mockReturnValue(mockSavedCall);

      const videoCallDto: InitiateCallDto = {
        chatId: mockChatId,
        type: CallType.VIDEO,
      };

      await service.initiateCall(
        videoCallDto,
        mockAuthId,
        mockCallerProfileId,
        false,
        false,
      );

      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            callerName: 'John Doe',
            callType: CallType.VIDEO,
          }),
        }),
      );
    });
  });

  describe('answerCall', () => {
    const answerCallDto: AnswerCallDto = {
      callId: mockCallId,
      accept: true,
    };

    const mockCall: any = {
      _id: mockCallId,
      chatId: mockChatId,
      callerId: mockUserId,
      callerProfileId: mockCallerProfileId,
      participantIds: [mockUserId, 'user-456'],
      participantProfileIds: [mockCallerProfileId, 'profile-456'],
      type: CallType.AUDIO,
      status: CallStatus.INITIATING,
      provider: 'agora',
      channelName: 'chat_chat123_1234567890',
      token: 'mock-token',
      callerUid: 123456789,
      participantUids: new Map([[mockUserId, 123456789]]),
      isRecording: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockReturnThis(),
      endReason: undefined,
      endedAt: undefined,
      startedAt: undefined,
    };

    it('should throw NotFoundException when call does not exist', async () => {
      callModel.findOne.mockResolvedValue(null);

      await expect(
        service.answerCall(answerCallDto, mockAuthId, 'user-456', 'profile-456'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should decline call when accept is false', async () => {
      const declinedCall = { ...mockCall, status: CallStatus.DECLINED };
      callModel.findOne.mockResolvedValue(mockCall);
      mockCall.status = CallStatus.DECLINED;
      mockCall.endReason = 'declined';
      mockCall.endedAt = new Date();

      const declineDto: AnswerCallDto = {
        callId: mockCallId,
        accept: false,
      };

      await service.answerCall(declineDto, mockAuthId, 'user-456', 'profile-456');

      expect(mockCall.save).toHaveBeenCalled();
      expect(mockCall.status).toBe(CallStatus.DECLINED);
      expect(mockCall.endReason).toBe('declined');
      expect(notificationService.sendNotification).toHaveBeenCalledWith({
        userId: mockUserId,
        type: NotificationType.CALL_DECLINED,
        data: {
          callId: mockCallId,
          chatId: mockChatId,
        },
      });
    });

    it('should accept call successfully', async () => {
      callModel.findOne.mockResolvedValue(mockCall);

      await service.answerCall(answerCallDto, mockAuthId, 'user-456', 'profile-456');

      expect(mockCall.status).toBe(CallStatus.CONNECTED);
      expect(mockCall.startedAt).toBeInstanceOf(Date);
      expect(mockCallProvider.generateToken).toHaveBeenCalledWith(
        mockCall.channelName,
        mockAuthId,
      );
      expect(mockCall.save).toHaveBeenCalled();
      expect(notificationService.sendNotification).toHaveBeenCalledTimes(
        mockCall.participantIds.length,
      );
    });

    it('should add answering user to participant UIDs', async () => {
      const answeringUserId = 'user-456';
      const answeringAuthId = '987654321';
      mockCallProvider.generateToken.mockResolvedValue({
        token: 'answerer-token',
        channelName: mockCall.channelName,
        uid: 987654321,
      });

      callModel.findOne.mockResolvedValue(mockCall);

      await service.answerCall(
        answerCallDto,
        answeringAuthId,
        answeringUserId,
        'profile-456',
      );

      expect(mockCall.participantUids.set).toHaveBeenCalledWith(
        answeringUserId,
        987654321,
      );
    });
  });

  describe('endCall', () => {
    const endCallDto: EndCallDto = {
      callId: mockCallId,
      reason: 'hung_up',
    };

    const mockConnectedCall: any = {
      _id: mockCallId,
      chatId: mockChatId,
      callerId: mockUserId,
      participantIds: [mockUserId, 'user-456'],
      type: CallType.AUDIO,
      status: CallStatus.CONNECTED,
      startedAt: new Date(Date.now() - 60000), // 1 minute ago
      duration: 0,
      save: jest.fn().mockResolvedValue(undefined),
      endReason: undefined,
      endedAt: undefined,
    };

    it('should throw NotFoundException when call does not exist', async () => {
      callModel.findOne.mockResolvedValue(null);

      await expect(service.endCall(endCallDto, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should end call and calculate duration', async () => {
      callModel.findOne.mockResolvedValue(mockConnectedCall);

      await service.endCall(endCallDto, mockUserId);

      expect(mockConnectedCall.status).toBe(CallStatus.ENDED);
      expect(mockConnectedCall.endedAt).toBeInstanceOf(Date);
      expect(mockConnectedCall.endReason).toBe('hung_up');
      expect(mockConnectedCall.duration).toBeGreaterThanOrEqual(60);
      expect(mockConnectedCall.save).toHaveBeenCalled();
    });

    it('should notify other participants when call ends', async () => {
      callModel.findOne.mockResolvedValue(mockConnectedCall);

      await service.endCall(endCallDto, mockUserId);

      // Should notify user-456 (the other participant)
      expect(notificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-456',
        type: NotificationType.CALL_ENDED,
        data: {
          callId: mockCallId,
          chatId: mockChatId,
          callType: CallType.AUDIO,
          duration: expect.any(Number),
        },
      });

      // Should not notify the user who ended the call
      expect(notificationService.sendNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should handle call with no startedAt (zero duration)', async () => {
      const callWithoutStarted = {
        ...mockConnectedCall,
        startedAt: undefined,
      };
      callModel.findOne.mockResolvedValue(callWithoutStarted);

      await service.endCall(endCallDto, mockUserId);

      expect(callWithoutStarted.duration).toBe(0);
    });
  });
});
