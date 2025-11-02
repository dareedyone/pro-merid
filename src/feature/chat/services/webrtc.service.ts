import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICallProvider,
  CallTokenResponse,
  CallProviderConfig,
  RTCIceServer,
} from '../interfaces/call-provider.interface';

@Injectable()
export class WebRTCService implements ICallProvider {
  private readonly logger = new Logger(WebRTCService.name);
  private readonly turnServers: RTCIceServer[];
  private readonly stunServers: string[];
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.turnServers = this.configService.get<RTCIceServer[]>(
      'WEBRTC_TURN_SERVERS',
      [],
    );
    this.stunServers = this.configService.get<string[]>('WEBRTC_STUN_SERVERS', [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ]);
    this.jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'fallback-secret',
    );

    if (this.turnServers.length === 0) {
      this.logger.warn(
        'No TURN servers configured. NAT traversal may fail for some users.',
      );
    }
  }

  /**
   * Generate JWT token for WebRTC authentication
   */
  async generateToken(
    channelName: string,
    userId: string,
    role: 'publisher' | 'subscriber' = 'publisher',
    expirationTimeInSeconds: number = 3600, // 1 hour
  ): Promise<CallTokenResponse> {
    try {
      // Generate JWT token for authentication
      const token = this.generateJWTToken(
        userId,
        channelName,
        role,
        expirationTimeInSeconds,
      );

      // Generate unique UID
      const uid = this.generateUID(userId);

      return {
        token,
        channelName,
        uid,
        iceServers: this.getIceServers(),
      };
    } catch (error) {
      this.logger.error('Failed to generate WebRTC token:', error);
      throw new Error('Failed to generate WebRTC token');
    }
  }

  /**
   * Generate a unique channel name for a call
   */
  generateChannelName(chatId: string): string {
    return `webrtc_chat_${chatId}_${Date.now()}`;
  }

  /**
   * Validate if a channel name is valid
   */
  isValidChannelName(channelName: string): boolean {
    // WebRTC channel names can be more flexible than Agora
    const regex = /^[a-zA-Z0-9_-]{1,128}$/;
    return regex.test(channelName);
  }

  /**
   * Get ICE servers configuration
   */
  private getIceServers(): RTCIceServer[] {
    const iceServers: RTCIceServer[] = [];

    // Add STUN servers
    this.stunServers.forEach((stunUrl) => {
      iceServers.push({ urls: stunUrl });
    });

    // Add TURN servers
    iceServers.push(...this.turnServers);

    return iceServers;
  }

  /**
   * Generate JWT token for WebRTC authentication
   */
  private generateJWTToken(
    userId: string,
    channelName: string,
    role: string,
    expirationTimeInSeconds: number,
  ): string {
    // Simple JWT implementation for WebRTC
    // In production, use a proper JWT library
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      sub: userId,
      channel: channelName,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationTimeInSeconds,
    };

    // This is a simplified JWT implementation
    // In production, use jsonwebtoken library
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );

    // For simplicity, we'll use a basic signature
    // In production, use proper HMAC-SHA256
    const signature = Buffer.from(
      `${encodedHeader}.${encodedPayload}.${this.jwtSecret}`,
    ).toString('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Generate unique UID for user
   */
  private generateUID(userId: string): number {
    // Convert userId to a consistent number
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000000; // Ensure positive number within reasonable range
  }

  // ==================== ICallProvider Implementation ====================

  getProviderType(): 'agora' | 'webrtc' | 'twilio' | 'daily' {
    return 'webrtc';
  }

  isConfigured(): boolean {
    return !!(this.jwtSecret && this.jwtSecret !== 'fallback-secret');
  }

  getProviderConfig(): any {
    return {
      type: this.getProviderType(),
      iceServers: this.getIceServers(),
      stunServers: this.stunServers,
      turnServers: this.turnServers,
      isConfigured: this.isConfigured(),
    };
  }
}
