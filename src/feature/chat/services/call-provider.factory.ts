import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICallProvider } from '../interfaces/call-provider.interface';
import { AgoraService } from './agora.service';
import { WebRTCService } from './webrtc.service';

export type CallProviderType = 'agora' | 'webrtc' | 'twilio' | 'daily';

@Injectable()
export class CallProviderFactory {
  private readonly logger = new Logger(CallProviderFactory.name);
  private readonly defaultProvider: CallProviderType;

  constructor(
    private readonly configService: ConfigService,
    private readonly agoraService: AgoraService,
    private readonly webrtcService: WebRTCService,
  ) {
    this.defaultProvider = this.configService.get<CallProviderType>(
      'CALL_PROVIDER',
      'agora',
    );
  }

  /**
   * Get the configured call provider
   */
  getProvider(providerType?: CallProviderType): ICallProvider {
    const provider = providerType || this.defaultProvider;

    switch (provider) {
      case 'agora':
        if (!this.agoraService.isConfigured()) {
          const errorMessage = 'Agora not configured.';
          this.logger.warn(errorMessage);
          throw new Error(errorMessage);
        }
        return this.agoraService;

      case 'webrtc':
        if (!this.webrtcService.isConfigured()) {
          const errorMessage = 'WebRTC not configured.';
          this.logger.warn(errorMessage);
          throw new Error(errorMessage);
        }
        return this.webrtcService;

      case 'twilio':
        // TODO: Implement Twilio service
        this.logger.warn(
          'Twilio provider not implemented, falling back to Agora',
        );
        return this.agoraService;

      case 'daily':
        // TODO: Implement Daily.co service
        this.logger.warn(
          'Daily.co provider not implemented, falling back to Agora',
        );
        return this.agoraService;

      default:
        this.logger.warn(
          `Unknown provider: ${provider}, falling back to Agora`,
        );
        return this.agoraService;
    }
  }

  /**
   * Get all available providers and their status
   */
  getAvailableProviders(): Record<
    CallProviderType,
    { available: boolean; configured: boolean }
  > {
    return {
      agora: {
        available: true,
        configured: this.agoraService.isConfigured(),
      },
      webrtc: {
        available: true,
        configured: this.webrtcService.isConfigured(),
      },
      twilio: {
        available: false,
        configured: false,
      },
      daily: {
        available: false,
        configured: false,
      },
    };
  }

  /**
   * Get the current default provider
   */
  getDefaultProvider(): CallProviderType {
    return this.defaultProvider;
  }

  /**
   * Check if a specific provider is available and configured
   */
  isProviderAvailable(providerType: CallProviderType): boolean {
    const providers = this.getAvailableProviders();
    return (
      providers[providerType]?.available && providers[providerType]?.configured
    );
  }
}
