import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, LoginTicket, TokenPayload } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID must be defined');
    }

    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<{ email: string; sub: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google client ID not configured');
    }

    let ticket: LoginTicket;
    try {
      ticket = (await this.client.verifyIdToken({
        idToken,
        audience: clientId,
      })) as LoginTicket;
    } catch {
      throw new UnauthorizedException('Failed to verify Google ID token');
    }

    const payload: unknown = ticket.getPayload();

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('email' in payload) ||
      !('sub' in payload)
    ) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const { email, sub } = payload as TokenPayload;

    if (typeof email !== 'string' || typeof sub !== 'string') {
      throw new UnauthorizedException('Invalid payload structure');
    }

    return { email, sub };
  }
}
