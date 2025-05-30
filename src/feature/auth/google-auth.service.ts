import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async verifyIdToken(
    idToken: string,
  ): Promise<{ email: string; sub: string }> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return { email: payload.email, sub: payload.sub };
  }
}
