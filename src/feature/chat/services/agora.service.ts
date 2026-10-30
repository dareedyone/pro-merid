import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import {
  ICallProvider,
  CallTokenResponse,
} from '../interfaces/call-provider.interface';

// Type assertions for agora-token package
const { buildTokenWithUid } = RtcTokenBuilder;
const { PUBLISHER, SUBSCRIBER } = RtcRole;

@Injectable()
export class AgoraService implements ICallProvider {
  private readonly logger = new Logger(AgoraService.name);
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('AGORA_APP_ID') || '';
    this.appCertificate =
      this.configService.get<string>('AGORA_APP_CERTIFICATE') || '';

    if (!this.appId || !this.appCertificate) {
      this.logger.warn(
        'Agora credentials not configured. Call functionality will be limited.',
      );
    }
  }

  /**
   * Generate Agora token for a user to join a channel
   */
  async generateToken(
    channelName: string,
    userId: string,
    role: 'publisher' | 'subscriber' = 'publisher',
    expirationTimeInSeconds: number = 3600, // 1 hour
  ): Promise<CallTokenResponse> {
    if (!this.appId || !this.appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    try {
      // Convert role to Agora RtcRole
      const agoraRole = role === 'publisher' ? PUBLISHER : SUBSCRIBER;

      // Convert authId (bigint as string) to numeric UID
      // This is the correct approach since auth.id is a bigint that can be converted to number
      const uid = parseInt(userId, 10);

      // Validate that the conversion was successful
      if (isNaN(uid) || uid <= 0) {
        throw new Error(`Invalid auth ID for UID conversion: ${userId}`);
      }

      // Generate RTC token using agora-token package
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const token = (buildTokenWithUid as any)(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        agoraRole,
        expirationTimeInSeconds,
        0, // privilegeExpire (optional, 0 means no privilege expiration)
      );

      this.logger.log(
        `Generated Agora token for user ${userId} in channel ${channelName}`,
      );

      return {
        token,
        channelName,
        uid,
      };
    } catch (error) {
      this.logger.error('Failed to generate Agora token:', error);
      // Preserve original error message if it's a validation error
      if (error instanceof Error && error.message.includes('Invalid auth ID')) {
        throw error;
      }
      throw new Error('Failed to generate Agora token');
    }
  }

  /**
   * Generate a unique channel name for a call
   */
  generateChannelName(chatId: string): string {
    return `chat_${chatId}_${Date.now()}`;
  }

  /**
   * Validate if a channel name is valid
   */
  isValidChannelName(channelName: string): boolean {
    // Agora channel names must be 1-64 characters, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{1,64}$/;
    return regex.test(channelName);
  }

  /**
   * Get Agora app configuration for client
   */
  getAppConfig() {
    return {
      appId: this.appId,
    };
  }

  // ==================== ICallProvider Implementation ====================

  getProviderType(): 'agora' | 'webrtc' | 'twilio' | 'daily' {
    return 'agora';
  }

  isConfigured(): boolean {
    return !!(this.appId && this.appCertificate);
  }

  getProviderConfig(): any {
    return {
      type: this.getProviderType(),
      appId: this.appId,
      isConfigured: this.isConfigured(),
    };
  }
}
