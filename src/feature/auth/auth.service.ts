import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EntityManager, EntityRepository, Loaded } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

import { randomInt } from 'crypto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { Anchor } from '../user/entities/user/anchor.entity';
import { EmailService } from 'src/system/email/email.service';
import { EmailQueueService } from 'src/system/queue/email/email.queue';

@Injectable()
export class AuthService {
  private appleJwksClient = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    // private readonly emailService: EmailService, // todo chang to queue instead
    private readonly em: EntityManager,
    private readonly emailQueueService: EmailQueueService,
    @InjectRepository(Auth) private authRepo: EntityRepository<Auth>,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
    @InjectRepository(Anchor) private anchorRepo: EntityRepository<Anchor>,
  ) {}

  // /** ✅ Sign Up */
  // async signUp(email: string, password: string) {
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const user = await this.usersService.createUser({
  //     email,
  //     password: hashedPassword,
  //   });
  //   return this.generateToken(user);
  // }

  // /** ✅ Login */
  // async login(email: string, password: string) {
  //   const user = await this.usersService.findByEmail(email);
  //   if (!user || !(await bcrypt.compare(password, user.password)))
  //     throw new Error('Invalid credentials');
  //   return this.generateToken(user);
  // }

  // /** ✅ Generate JWT */
  // async generateToken(user) {
  //   return {
  //     access_token: this.jwtService.sign({ id: user.id, email: user.email }),
  //   };
  // }

  // /** ✅ Validate Google Token */
  // async validateGoogleToken(token: string) {
  //   const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  //   const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;

  //   try {
  //     const { data } = await axios.get(url);
  //     if (data.aud !== GOOGLE_CLIENT_ID)
  //       throw new Error('Invalid Google token');

  //     let user = await this.usersService.findByEmail(data.email);
  //     if (!user) {
  //       user = await this.usersService.createUser({
  //         email: data.email,
  //         googleId: data.sub,
  //       });
  //     }
  //     return this.generateToken(user);
  //   } catch (err) {
  //     throw new Error('Google token verification failed');
  //   }
  // }

  // /** ✅ Validate Apple Token */
  // async validateAppleToken(identityToken: string) {
  //   const decodedHeader = jwt.decode(identityToken, { complete: true });
  //   const key = await this.appleJwksClient.getSigningKey(
  //     decodedHeader.header.kid,
  //   );
  //   const publicKey = key.getPublicKey();
  //   const payload: any = jwt.verify(identityToken, publicKey, {
  //     issuer: 'https://appleid.apple.com',
  //   });

  //   let user = await this.usersService.findByAppleId(payload.sub);
  //   if (!user) {
  //     user = await this.usersService.createUser({
  //       email: payload.email || `private-${payload.sub}@appleid.com`,
  //       appleId: payload.sub,
  //     });
  //   }
  //   return this.generateToken(user);
  // }

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  // async sendLoginCode(email: string) {
  //   const code = this.generateCode();

  //   const record = new VerificationCode();
  //   record.email = email;
  //   record.code = code;
  //   record.createdAt = new Date();
  //   await this.em.persistAndFlush(record);

  //   await this.emailService.sendVerificationCode(email, code);
  // }

  async sendEmailCode(email: string): Promise<void> {
    const now = new Date();
    const code = this.generateCode();
    let auth = await this.authRepo.findOne({ email });

    if (!auth) {
      auth = this.authRepo.create({ email });
    }

    if (
      auth?.lastCodeSentAt &&
      now.getTime() - auth.lastCodeSentAt.getTime() < 60_000
    ) {
      throw new HttpException(
        'Please wait before requesting another code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    auth.emailCode = code;
    auth.lastCodeSentAt = now;
    await this.em.persistAndFlush(auth);
    await this.emailQueueService.sendEmailCode({ email, code });
  }

  // async verifyLoginCode(email: string, code: string) {
  //   const record = await this.em.findOne(
  //     VerificationCode,
  //     { email, code },
  //     { orderBy: { createdAt: 'DESC' } },
  //   );

  //   if (!record || Date.now() - record.createdAt.getTime() > 10 * 60 * 1000) {
  //     throw new UnauthorizedException('Invalid or expired code');
  //   }

  //   await this.em.removeAndFlush(record);

  //   let user = await this.em.findOne(User, { email });
  //   if (!user) {
  //     user = this.em.create(User, { email, emailVerified: true });
  //     await this.em.persistAndFlush(user);
  //   }

  //   return this.issueToken(user);
  // }

  async verifyCode(email: string, code: string): Promise<string> {
    const auth = await this.authRepo.findOne(
      { email },
      { populate: ['user', 'anchor'] },
    );
    if (!auth || auth.emailVerificationToken !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    auth.isEmailVerified = true;
    auth.emailVerificationToken = null;

    let user = auth.user || auth.anchor;
    if (!user) {
      if (auth.role === UserType.ANCHOR) {
        user = this.anchorRepo.create({ email });
        auth.anchor = user;
      } else {
        user = this.userRepo.create({ email });
        auth.user = user;
      }
      await this.authRepo.persistAndFlush(auth);
    } else {
      await this.authRepo.flush();
    }

    return this.jwtService.sign({ sub: auth.id, role: auth.role });
  }

  async loginWithOAuth(
    provider: 'google' | 'apple',
    providerId: string,
    email?: string,
  ) {
    let user = await this.em.findOne(User, {
      ...(provider === 'google'
        ? { googleId: providerId }
        : { appleId: providerId }),
    });

    if (!user && email) {
      user = this.em.create(User, {
        email,
        emailVerified: true,
        ...(provider === 'google'
          ? { googleId: providerId }
          : { appleId: providerId }),
      });
      await this.em.persistAndFlush(user);
    }

    if (!user) throw new UnauthorizedException('User not found');

    return this.issueToken(user);
  }

  private issueToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { token, user };
  }

  async oauthLogin(
    email: string,
    providerId: string,
    provider: 'google' | 'apple',
    role: UserType,
  ): Promise<string> {
    let auth = await this.authRepo.findOne({ email });

    if (!auth) {
      auth = this.authRepo.create({ email, isEmailVerified: true, role });
    }

    if (provider === 'google') auth.googleId = providerId;
    if (provider === 'apple') auth.appleId = providerId;

    let user = auth.user || auth.anchor;
    if (!user) {
      user =
        role === UserType.ANCHOR
          ? this.anchorRepo.create({ email })
          : this.userRepo.create({ email });

      if (role === UserType.ANCHOR) auth.anchor = user as Anchor;
      else auth.user = user as User;
    }

    await this.authRepo.persistAndFlush(auth);
    return this.jwtService.sign({ sub: auth.id, role: auth.role });
  }
}
