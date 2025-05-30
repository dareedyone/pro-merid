import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class AppleAuthService {
  private client = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
    cache: true,
    rateLimit: true,
  });

  private getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    this.client.getSigningKey(header.kid!, (err, key) => {
      const signingKey = key?.getPublicKey();
      callback(err, signingKey);
    });
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<{ email?: string; sub: string }> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        idToken,
        this.getKey.bind(this),
        { algorithms: ['RS256'] },
        (err, decoded) => {
          if (err)
            return reject(new UnauthorizedException('Invalid Apple ID token'));
          const payload = decoded as jwt.JwtPayload;
          resolve({ sub: payload.sub, email: payload.email });
        },
      );
    });
  }
}
// npm install jwks-rsa jsonwebtoken
// Apple issues a JWT (id_token) that is:

// Signed with one of Apple’s public keys

// Contains sub (Apple user ID) and optionally email

// We:

// Fetch the public key via JWKS

// Verify signature and decode the token

// Return sub and email