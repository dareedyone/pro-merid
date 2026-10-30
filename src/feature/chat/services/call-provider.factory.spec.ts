import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CallProviderFactory } from './call-provider.factory';
import { AgoraService } from './agora.service';
import { WebRTCService } from './webrtc.service';

describe('CallProviderFactory', () => {
  let factory: CallProviderFactory;
  let agoraService: any;
  let webrtcService: any;
  let configService: any;

  beforeEach(async () => {
    const mockAgoraService = {
      isConfigured: jest.fn().mockReturnValue(true),
      getProviderType: jest.fn().mockReturnValue('agora'),
    };

    const mockWebRTCService = {
      isConfigured: jest.fn().mockReturnValue(true),
      getProviderType: jest.fn().mockReturnValue('webrtc'),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'CALL_PROVIDER') return 'agora';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallProviderFactory,
        {
          provide: AgoraService,
          useValue: mockAgoraService,
        },
        {
          provide: WebRTCService,
          useValue: mockWebRTCService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    factory = module.get<CallProviderFactory>(CallProviderFactory);
    agoraService = module.get(AgoraService);
    webrtcService = module.get(WebRTCService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('getProvider', () => {
    it('should return Agora service by default', () => {
      const provider = factory.getProvider();
      expect(provider).toBe(agoraService);
      expect(agoraService.isConfigured).toHaveBeenCalled();
    });

    it('should return Agora service when explicitly requested', () => {
      const provider = factory.getProvider('agora');
      expect(provider).toBe(agoraService);
    });

    it('should return WebRTC service when requested', () => {
      const provider = factory.getProvider('webrtc');
      expect(provider).toBe(webrtcService);
      expect(webrtcService.isConfigured).toHaveBeenCalled();
    });

    it('should throw error when Agora is not configured', () => {
      agoraService.isConfigured.mockReturnValue(false);

      expect(() => factory.getProvider('agora')).toThrow(
        'Agora not configured.',
      );
    });

    it('should throw error when WebRTC is not configured', () => {
      webrtcService.isConfigured.mockReturnValue(false);

      expect(() => factory.getProvider('webrtc')).toThrow(
        'WebRTC not configured.',
      );
    });

    it('should fallback to Agora for unimplemented providers', () => {
      const provider = factory.getProvider('twilio');
      expect(provider).toBe(agoraService);
    });

    it('should fallback to Agora for daily.co', () => {
      const provider = factory.getProvider('daily');
      expect(provider).toBe(agoraService);
    });

    it('should fallback to Agora for unknown provider', () => {
      const provider = factory.getProvider('unknown' as any);
      expect(provider).toBe(agoraService);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return status of all providers', () => {
      const providers = factory.getAvailableProviders();

      expect(providers).toHaveProperty('agora');
      expect(providers).toHaveProperty('webrtc');
      expect(providers).toHaveProperty('twilio');
      expect(providers).toHaveProperty('daily');
      expect(providers.agora.configured).toBe(true);
      expect(providers.webrtc.configured).toBe(true);
      expect(providers.twilio.available).toBe(false);
      expect(providers.daily.available).toBe(false);
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider from config', () => {
      const defaultProvider = factory.getDefaultProvider();
      expect(defaultProvider).toBe('agora');
    });
  });

  describe('isProviderAvailable', () => {
    it('should return true for configured provider', () => {
      expect(factory.isProviderAvailable('agora')).toBe(true);
      expect(factory.isProviderAvailable('webrtc')).toBe(true);
    });

    it('should return false for unavailable provider', () => {
      expect(factory.isProviderAvailable('twilio')).toBe(false);
      expect(factory.isProviderAvailable('daily')).toBe(false);
    });

    it('should return false for unconfigured provider', () => {
      agoraService.isConfigured.mockReturnValue(false);
      expect(factory.isProviderAvailable('agora')).toBe(false);
    });
  });
});

