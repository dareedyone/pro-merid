import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

@Injectable()
export class AuthService {
  private appleJwksClient = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** ✅ Sign Up */
  async signUp(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
    });
    return this.generateToken(user);
  }

  /** ✅ Login */
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new Error('Invalid credentials');
    return this.generateToken(user);
  }

  /** ✅ Generate JWT */
  async generateToken(user) {
    return {
      access_token: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }

  /** ✅ Validate Google Token */
  async validateGoogleToken(token: string) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;

    try {
      const { data } = await axios.get(url);
      if (data.aud !== GOOGLE_CLIENT_ID)
        throw new Error('Invalid Google token');

      let user = await this.usersService.findByEmail(data.email);
      if (!user) {
        user = await this.usersService.createUser({
          email: data.email,
          googleId: data.sub,
        });
      }
      return this.generateToken(user);
    } catch (err) {
      throw new Error('Google token verification failed');
    }
  }

  /** ✅ Validate Apple Token */
  async validateAppleToken(identityToken: string) {
    const decodedHeader = jwt.decode(identityToken, { complete: true });
    const key = await this.appleJwksClient.getSigningKey(
      decodedHeader.header.kid,
    );
    const publicKey = key.getPublicKey();
    const payload: any = jwt.verify(identityToken, publicKey, {
      issuer: 'https://appleid.apple.com',
    });

    let user = await this.usersService.findByAppleId(payload.sub);
    if (!user) {
      user = await this.usersService.createUser({
        email: payload.email || `private-${payload.sub}@appleid.com`,
        appleId: payload.sub,
      });
    }
    return this.generateToken(user);
  }
}
