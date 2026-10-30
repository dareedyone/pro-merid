import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebRTCService } from './webrtc.service';

describe('WebRTCService', () => {
  let service: WebRTCService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'WEBRTC_TURN_SERVERS') return [];
        if (key === 'WEBRTC_STUN_SERVERS')
          return ['stun:stun.l.google.com:19302'];
        if (key === 'JWT_SECRET') return 'test-secret';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebRTCService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebRTCService>(WebRTCService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProviderType', () => {
    it('should return "webrtc" as provider type', () => {
      expect(service.getProviderType()).toBe('webrtc');
    });
  });

  describe('isConfigured', () => {
    it('should return true when JWT secret is configured', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when JWT secret is fallback', () => {
      jest.spyOn(configService, 'get').mockReturnValue('fallback-secret');
      const unconfiguredService = new WebRTCService(configService);
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('generateChannelName', () => {
    it('should generate channel name with chat ID and timestamp', () => {
      const chatId = 'chat-123';
      const channelName = service.generateChannelName(chatId);
      expect(channelName).toContain(`webrtc_chat_${chatId}_`);
      expect(channelName).toMatch(/^webrtc_chat_chat-123_\d+$/);
    });

    it('should generate unique channel names', async () => {
      const chatId = 'chat-123';
      const name1 = service.generateChannelName(chatId);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const name2 = service.generateChannelName(chatId);
      expect(name1).not.toBe(name2);
    });
  });

  describe('isValidChannelName', () => {
    it('should validate correct channel names', () => {
      expect(service.isValidChannelName('webrtc_chat_123_123456')).toBe(true);
      expect(service.isValidChannelName('test-channel-1')).toBe(true);
      expect(service.isValidChannelName('a')).toBe(true);
    });

    it('should reject invalid channel names', () => {
      expect(service.isValidChannelName('')).toBe(false);
      expect(service.isValidChannelName('channel with spaces')).toBe(false);
      expect(service.isValidChannelName('channel@special')).toBe(false);
      expect(
        service.isValidChannelName('A'.repeat(129)),
      ).toBe(false); // Too long
    });
  });

  describe('generateToken', () => {
    const validUserId = 'user-123';
    const channelName = 'webrtc_chat_123_1234567890';

    it('should generate token successfully', async () => {
      const result = await service.generateToken(channelName, validUserId);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('channelName', channelName);
      expect(result).toHaveProperty('uid');
      expect(result).toHaveProperty('iceServers');
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3); // JWT format
    });

    it('should generate token with publisher role', async () => {
      const result = await service.generateToken(
        channelName,
        validUserId,
        'publisher',
      );

      expect(result.token).toBeTruthy();
    });

    it('should generate token with subscriber role', async () => {
      const result = await service.generateToken(
        channelName,
        validUserId,
        'subscriber',
      );

      expect(result.token).toBeTruthy();
    });

    it('should include ICE servers in response', async () => {
      const result = await service.generateToken(channelName, validUserId);

      expect(result.iceServers).toBeDefined();
      if (result.iceServers) {
        expect(Array.isArray(result.iceServers)).toBe(true);
        expect(result.iceServers.length).toBeGreaterThan(0);
      }
    });

    it('should generate consistent UID for same user', async () => {
      const result1 = await service.generateToken(channelName, validUserId);
      const result2 = await service.generateToken(channelName, validUserId);

      expect(result1.uid).toBe(result2.uid);
    });

    it('should generate different UIDs for different users', async () => {
      const result1 = await service.generateToken(channelName, 'user-1');
      const result2 = await service.generateToken(channelName, 'user-2');

      expect(result1.uid).not.toBe(result2.uid);
    });

    it('should handle custom expiration time', async () => {
      const customExpiration = 7200; // 2 hours
      const result = await service.generateToken(
        channelName,
        validUserId,
        'publisher',
        customExpiration,
      );

      expect(result.token).toBeTruthy();
      // Token should be valid (JWT structure)
      expect(result.token.split('.')).toHaveLength(3);
    });
  });

  describe('getProviderConfig', () => {
    it('should return provider configuration', () => {
      const config = service.getProviderConfig();

      expect(config).toHaveProperty('type', 'webrtc');
      expect(config).toHaveProperty('iceServers');
      expect(config).toHaveProperty('stunServers');
      expect(config).toHaveProperty('turnServers');
      expect(config).toHaveProperty('isConfigured', true);
    });
  });
});

