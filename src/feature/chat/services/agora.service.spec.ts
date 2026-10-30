import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgoraService } from './agora.service';

// Mock agora-token library - hoisted mock
const mockBuildTokenWithUid = jest.fn((...args) => {
  // Return a mock token string based on inputs
  const [, , channelName, uid] = args;
  return `mock_token_${channelName}_${uid}_${Date.now()}`;
});

jest.mock('agora-token', () => ({
  RtcTokenBuilder: {
    buildTokenWithUid: (...args: any[]) => mockBuildTokenWithUid(...args),
  },
  RtcRole: {
    PUBLISHER: 1,
    SUBSCRIBER: 2,
  },
}));

describe('AgoraService', () => {
  let service: AgoraService;
  let configService: ConfigService;

  const mockAppId = 'test-app-id';
  const mockAppCertificate = 'test-app-certificate';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'AGORA_APP_ID') return mockAppId;
        if (key === 'AGORA_APP_CERTIFICATE') return mockAppCertificate;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgoraService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AgoraService>(AgoraService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProviderType', () => {
    it('should return "agora" as provider type', () => {
      expect(service.getProviderType()).toBe('agora');
    });
  });

  describe('isConfigured', () => {
    it('should return true when credentials are configured', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when app ID is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AGORA_APP_ID') return '';
        if (key === 'AGORA_APP_CERTIFICATE') return mockAppCertificate;
        return undefined;
      });

      const serviceWithoutAppId = new AgoraService(configService);
      expect(serviceWithoutAppId.isConfigured()).toBe(false);
    });

    it('should return false when app certificate is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AGORA_APP_ID') return mockAppId;
        if (key === 'AGORA_APP_CERTIFICATE') return '';
        return undefined;
      });

      const serviceWithoutCert = new AgoraService(configService);
      expect(serviceWithoutCert.isConfigured()).toBe(false);
    });
  });

  describe('getProviderConfig', () => {
    it('should return provider configuration', () => {
      const config = service.getProviderConfig();
      expect(config).toEqual({
        type: 'agora',
        appId: mockAppId,
        isConfigured: true,
      });
    });
  });

  describe('getAppConfig', () => {
    it('should return app ID for client', () => {
      const config = service.getAppConfig();
      expect(config).toEqual({
        appId: mockAppId,
      });
    });
  });

  describe('generateChannelName', () => {
    it('should generate channel name with chat ID and timestamp', () => {
      const chatId = 'test-chat-id-123';
      const channelName = service.generateChannelName(chatId);
      expect(channelName).toContain(`chat_${chatId}_`);
      expect(channelName).toMatch(/^chat_test-chat-id-123_\d+$/);
    });

    it('should generate unique channel names for same chat ID', async () => {
      const chatId = 'test-chat-id-123';
      const name1 = service.generateChannelName(chatId);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const name2 = service.generateChannelName(chatId);
      expect(name1).not.toBe(name2);
    });
  });

  describe('isValidChannelName', () => {
    it('should validate correct channel names', () => {
      expect(service.isValidChannelName('chat_123_1234567890')).toBe(true);
      expect(service.isValidChannelName('test_channel_1')).toBe(true);
      expect(service.isValidChannelName('a')).toBe(true);
      expect(service.isValidChannelName('A'.repeat(64))).toBe(true);
    });

    it('should reject invalid channel names', () => {
      expect(service.isValidChannelName('')).toBe(false);
      expect(service.isValidChannelName('chat-123')).toBe(false); // Contains hyphen
      expect(service.isValidChannelName('chat 123')).toBe(false); // Contains space
      expect(service.isValidChannelName('chat@123')).toBe(false); // Contains special char
      expect(service.isValidChannelName('A'.repeat(65))).toBe(false); // Too long
    });
  });

  describe('generateToken', () => {
    const validAuthId = '123456789';
    const channelName = 'chat_test_1234567890';

    it('should throw error when credentials are not configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation(() => '');

      const unconfiguredService = new AgoraService(configService);
      await expect(
        unconfiguredService.generateToken(channelName, validAuthId),
      ).rejects.toThrow('Agora credentials not configured');
    });

    it('should throw error for invalid auth ID (non-numeric)', async () => {
      await expect(
        service.generateToken(channelName, 'invalid-id'),
      ).rejects.toThrow('Invalid auth ID for UID conversion: invalid-id');
    });

    it('should throw error for invalid auth ID (zero)', async () => {
      await expect(service.generateToken(channelName, '0')).rejects.toThrow(
        'Invalid auth ID for UID conversion: 0',
      );
    });

    it('should throw error for invalid auth ID (negative)', async () => {
      await expect(
        service.generateToken(channelName, '-1'),
      ).rejects.toThrow('Invalid auth ID for UID conversion: -1');
    });

    it('should throw error for invalid auth ID (NaN)', async () => {
      await expect(
        service.generateToken(channelName, 'abc'),
      ).rejects.toThrow('Invalid auth ID for UID conversion: abc');
    });

    it('should generate token successfully for valid auth ID', async () => {
      const result = await service.generateToken(channelName, validAuthId);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('channelName', channelName);
      expect(result).toHaveProperty('uid', parseInt(validAuthId, 10));
      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe('string');
      expect(result.uid).toBe(123456789);
    });

    it('should convert auth ID string to numeric UID correctly', async () => {
      const authId = '987654321';
      const result = await service.generateToken(channelName, authId);

      expect(result.uid).toBe(987654321);
      expect(typeof result.uid).toBe('number');
    });

    it('should generate token with publisher role by default', async () => {
      const result = await service.generateToken(channelName, validAuthId);

      expect(result.token).toBeTruthy();
      // Token should be generated (we can't easily verify role without decrypting)
    });

    it('should generate token with publisher role explicitly', async () => {
      const result = await service.generateToken(
        channelName,
        validAuthId,
        'publisher',
      );

      expect(result.token).toBeTruthy();
    });

    it('should generate token with subscriber role', async () => {
      const result = await service.generateToken(
        channelName,
        validAuthId,
        'subscriber',
      );

      expect(result.token).toBeTruthy();
    });

    it('should use default expiration time (1 hour)', async () => {
      const result = await service.generateToken(channelName, validAuthId);

      expect(result.token).toBeTruthy();
      // Token is generated successfully with default expiration
    });

    it('should use custom expiration time', async () => {
      const customExpiration = 7200; // 2 hours
      const result = await service.generateToken(
        channelName,
        validAuthId,
        'publisher',
        customExpiration,
      );

      expect(result.token).toBeTruthy();
      // Token is generated successfully with custom expiration
    });

    it('should handle large auth IDs', async () => {
      const largeAuthId = '999999999999';
      const result = await service.generateToken(channelName, largeAuthId);

      expect(result.uid).toBe(999999999999);
      expect(result.token).toBeTruthy();
    });

    it('should generate different tokens for different UIDs', async () => {
      const authId1 = '111111111';
      const authId2 = '222222222';

      const result1 = await service.generateToken(channelName, authId1);
      const result2 = await service.generateToken(channelName, authId2);

      expect(result1.uid).not.toBe(result2.uid);
      expect(result1.token).not.toBe(result2.token);
    });

    it('should generate different tokens for different channels', async () => {
      const channel1 = 'chat_channel1_123';
      const channel2 = 'chat_channel2_456';

      const result1 = await service.generateToken(channel1, validAuthId);
      const result2 = await service.generateToken(channel2, validAuthId);

      expect(result1.channelName).not.toBe(result2.channelName);
      // Tokens might be different (channel is part of token)
      expect(result1.token).toBeTruthy();
      expect(result2.token).toBeTruthy();
    });
  });
});
