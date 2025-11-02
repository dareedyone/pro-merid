export interface CallTokenResponse {
  token: string;
  channelName: string;
  uid: number;
  serverUrl?: string; // For self-hosted TURN servers
  iceServers?: RTCIceServer[]; // For WebRTC configuration
}

export interface CallProviderConfig {
  appId?: string; // For Agora
  appCertificate?: string; // For Agora
  turnServers?: RTCIceServer[]; // For self-hosted
  stunServers?: string[]; // For self-hosted
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface ICallProvider {
  /**
   * Generate authentication token for joining a call
   */
  generateToken(
    channelName: string,
    userId: string,
    role?: 'publisher' | 'subscriber',
    expirationTimeInSeconds?: number,
  ): Promise<CallTokenResponse>;

  /**
   * Generate a unique channel name for a call
   */
  generateChannelName(chatId: string): string;

  /**
   * Validate if a channel name is valid
   */
  isValidChannelName(channelName: string): boolean;

  /**
   * Get provider configuration for client
   */
  getProviderConfig(): any;

  /**
   * Get provider type
   */
  getProviderType(): 'agora' | 'webrtc' | 'twilio' | 'daily';

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;
}
