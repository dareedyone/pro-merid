import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ActivityService } from './activity.service';
import { RedisService } from '../../system/cache/redis.service';
import { ChatService } from '../chat/chat.service';
import { User } from '../user/entities/user/user.entity';
import { Match } from '../../common/entities/match.entity';
import { Message } from '../chat/entities/message.entity';
import { REDIS_KEYS } from '../../common/constants/redis-keys';

describe('ActivityService', () => {
  let service: ActivityService;
  let userRepo: any;
  let matchRepo: any;
  let redisService: any;
  let chatService: any;
  let messageModel: any;
  let configService: any;

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    firstName: 'John',
    lastName: 'Doe',
    lastSeenAt: new Date(),
    timezone: 'America/New_York',
    isActivated: true,
    auth: {
      email: 'john@example.com',
    },
  };

  beforeEach(async () => {
    const mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      nativeUpdate: jest.fn(),
    };

    const mockMatchRepo = {
      find: jest.fn(),
    };

    const mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      hGetAll: jest.fn(),
    };

    const mockChatService = {
      getChatByMatchId: jest.fn(),
    };

    const mockMessageModel = {
      countDocuments: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'ACTIVITY_CACHE_TTL_HOURS') return 1;
        if (key === 'EMAIL_COOLDOWN_DAYS') return 7;
        if (key === 'OFFLINE_EMAIL_DURATION_HOURS') return 24;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchRepo,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityManager,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    userRepo = module.get(getRepositoryToken(User));
    matchRepo = module.get(getRepositoryToken(Match));
    redisService = module.get(RedisService);
    chatService = module.get(ChatService);
    messageModel = module.get(getModelToken(Message.name));
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateLastSeen', () => {
    it('should update last seen in Redis and database', async () => {
      await service.updateLastSeen(mockUserId);

      expect(redisService.set).toHaveBeenCalledWith(
        `${REDIS_KEYS.LAST_SEEN_PREFIX}${mockUserId}`,
        expect.any(String),
        3600,
      );
      expect(userRepo.nativeUpdate).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      redisService.set.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.updateLastSeen(mockUserId)).resolves.not.toThrow();
    });
  });

  describe('getLastSeen', () => {
    it('should return cached last seen from Redis', async () => {
      const cachedDate = new Date().toISOString();
      redisService.get.mockResolvedValue(cachedDate);

      const result = await service.getLastSeen(mockUserId);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(cachedDate);
      expect(redisService.get).toHaveBeenCalledWith(
        `${REDIS_KEYS.LAST_SEEN_PREFIX}${mockUserId}`,
      );
    });

    it('should fallback to database when cache miss', async () => {
      redisService.get.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ lastSeenAt: new Date() });

      const result = await service.getLastSeen(mockUserId);

      expect(result).toBeInstanceOf(Date);
      expect(userRepo.findOne).toHaveBeenCalledWith(
        { id: mockUserId },
        { fields: ['lastSeenAt'] },
      );
    });

    it('should return null when user not found', async () => {
      redisService.get.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.getLastSeen(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getOfflineUsers', () => {
    it('should return offline users based on duration', async () => {
      const offlineDurationMs = 24 * 60 * 60 * 1000;
      userRepo.find.mockResolvedValue([mockUser]);

      const result = await service.getOfflineUsers(offlineDurationMs);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockUserId);
      expect(userRepo.find).toHaveBeenCalled();
    });

    it('should exclude emailed users when option is set', async () => {
      const offlineDurationMs = 24 * 60 * 60 * 1000;
      redisService.hGetAll.mockResolvedValue({ 'user-456': '2024-01-01' });
      userRepo.find.mockResolvedValue([mockUser]);

      const result = await service.getOfflineUsers(offlineDurationMs, 1000, {
        excludeEmailedToday: true,
      });

      expect(redisService.hGetAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by specific user IDs', async () => {
      const offlineDurationMs = 24 * 60 * 60 * 1000;
      userRepo.find.mockResolvedValue([mockUser]);

      const result = await service.getOfflineUsers(offlineDurationMs, 1000, {
        specificUserIds: [mockUserId],
      });

      expect(result).toHaveLength(1);
      expect(userRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [mockUserId] },
        }),
        expect.any(Object),
      );
    });

    it('should return empty array when all specific users are excluded', async () => {
      redisService.hGetAll.mockResolvedValue({ [mockUserId]: '2024-01-01' });

      const result = await service.getOfflineUsers(1000, 1000, {
        specificUserIds: [mockUserId],
        excludeEmailedToday: true,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('batchUpdateLastSeen', () => {
    it('should batch update last seen for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      await service.batchUpdateLastSeen(userIds);

      expect(userRepo.nativeUpdate).toHaveBeenCalledWith(
        { id: { $in: userIds } },
        { lastSeenAt: expect.any(Date) },
      );
    });
  });

  describe('getActivityStats', () => {
    it('should return activity statistics', async () => {
      userRepo.count.mockResolvedValueOnce(100); // totalUsers
      userRepo.count.mockResolvedValueOnce(50); // activeLastHour
      userRepo.count.mockResolvedValueOnce(75); // activeLastDay
      userRepo.count.mockResolvedValueOnce(90); // activeLastWeek

      const result = await service.getActivityStats();

      expect(result).toEqual({
        totalUsers: 100,
        activeLastHour: 50,
        activeLastDay: 75,
        activeLastWeek: 90,
      });
      expect(userRepo.count).toHaveBeenCalledTimes(4);
    });

    it('should return zeros on error', async () => {
      userRepo.count.mockRejectedValue(new Error('Database error'));

      const result = await service.getActivityStats();

      expect(result).toEqual({
        totalUsers: 0,
        activeLastHour: 0,
        activeLastDay: 0,
        activeLastWeek: 0,
      });
    });
  });

  describe('getMissedActivity', () => {
    it('should return missed matches and messages', async () => {
      const mockMatch = {
        id: 'match-123',
        sourceUserId: mockUserId,
        targetUserId: 'user-456',
        matchedAt: new Date(),
        sourceUser: { displayName: 'John Doe' },
        targetUser: { displayName: 'Jane Doe' },
      };

      matchRepo.find.mockResolvedValue([mockMatch]);
      chatService.getChatByMatchId.mockResolvedValue({ _id: 'chat-123' });
      messageModel.countDocuments.mockResolvedValue(5);

      const result = await service.getMissedActivity(mockUserId);

      expect(result.matches).toBe(1);
      expect(result.messages).toBe(5);
      expect(result.matchDetails).toHaveLength(1);
      expect(result.matchDetails[0].matchedUserId).toBe('user-456');
    });

    it('should handle users with no lastSeenAt', async () => {
      matchRepo.find.mockResolvedValue([]);

      const result = await service.getMissedActivity(mockUserId, null);

      expect(result.matches).toBe(0);
      expect(result.messages).toBe(0);
    });

    it('should return empty on error', async () => {
      matchRepo.find.mockRejectedValue(new Error('Database error'));

      const result = await service.getMissedActivity(mockUserId);

      expect(result).toEqual({
        matches: 0,
        messages: 0,
        matchDetails: [],
      });
    });
  });

  describe('isAppropriateTimeForUser', () => {
    it('should return true for appropriate time (8-22 hours)', async () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        format: jest.fn().mockReturnValue('14'),
      } as any));

      const user = { ...mockUser, timezone: 'America/New_York' };
      const result = await service.isAppropriateTimeForUser(user);

      expect(result).toBe(true);
    });

    it('should return false for inappropriate time (before 8 or after 22)', async () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        format: jest.fn().mockReturnValue('23'),
      } as any));

      const user = { ...mockUser, timezone: 'America/New_York' };
      const result = await service.isAppropriateTimeForUser(user);

      expect(result).toBe(false);
    });

    it('should default to true on timezone error', async () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        throw new Error('Invalid timezone');
      });

      const user = { ...mockUser, timezone: 'Invalid/Timezone' };
      const result = await service.isAppropriateTimeForUser(user);

      expect(result).toBe(true);
    });
  });
});

