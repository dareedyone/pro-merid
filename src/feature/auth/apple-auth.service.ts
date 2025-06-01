import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwksClient from 'jwks-rsa';
import {
  verify,
  JwtPayload,
  SigningKeyCallback,
  JwtHeader,
} from 'jsonwebtoken';

@Injectable()
export class AppleAuthService {
  private client: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    const jwksUri =
      this.configService.get<string>('APPLE_JWKS_URI') ??
      'https://appleid.apple.com/auth/keys';

    this.client = jwksClient({
      jwksUri,
      cache: true,
      rateLimit: true,
    });
  }

  private getKey(header: JwtHeader, callback: SigningKeyCallback) {
    this.client.getSigningKey(header.kid!, (err, key) => {
      if (err) return callback(err, undefined);

      const signingKey = key?.getPublicKey();

      if (!signingKey) {
        return callback(new Error('Signing key not found'), undefined);
      }
      callback(null, signingKey);
    });
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<{ email: string; sub: string }> {
    const expectedAudience = this.configService.get<string>('APPLE_AUDIENCE');
    const expectedIssuer = 'https://appleid.apple.com';

    return new Promise((resolve, reject) => {
      verify(
        idToken,
        this.getKey.bind(this),
        {
          algorithms: ['RS256'],
          issuer: expectedIssuer,
          audience: expectedAudience,
        },
        (err, decoded) => {
          if (err)
            return reject(new UnauthorizedException('Invalid Apple ID token'));

          const payload = decoded as JwtPayload;

          if (!payload?.sub || !payload?.email) {
            return reject(
              new UnauthorizedException('Token missing subject (sub) or email'),
            );
          }

          resolve({ sub: payload.sub, email: payload.email });
        },
      );
    });
  }
}

// Apple issues a JWT (id_token) that is:

// Signed with one of Apple’s public keys

// Contains sub (Apple user ID) and optionally email

// We:

// Fetch the public key via JWKS

// Verify signature and decode the token

// Return sub and email
