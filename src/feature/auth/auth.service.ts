import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager, EntityRepository, Populate } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Auth } from './entities/auth.entity';
import { User } from '../user/entities/user/user.entity';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';
import {
  AuthResponseType,
  SendEMailCodeDto,
  VerifyEMailCodeDto,
} from './dto/email.dto';
import { UserType } from 'src/common/types/enums/user.enum';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { OAuthSignInDto } from './dto/oauth-signin.dto';
import { PushTokenDto } from './dto/push-token.dto';
import { OrmHelperService } from 'src/common/services/orm-helper.service';
import { IssueTokenPayload } from 'src/common/types/interface/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly appleAuthService: AppleAuthService,
    private readonly em: EntityManager,
    private readonly ormHelper: OrmHelperService,
    private readonly emailQueueService: EmailQueueService,
    @InjectRepository(Auth) private authRepo: EntityRepository<Auth>,
    // @InjectRepository(User) private userRepo: EntityRepository<User>,
    // @InjectRepository(Anchor) private anchorRepo: EntityRepository<Anchor>,
  ) {}

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private isTimeWithin(date?: Date, ms = 60_000): boolean {
    return date ? Date.now() - new Date(date).getTime() < ms : false;
  }

  async fetchAuthUser(authId: string): Promise<Auth & { user: User }>;
  async fetchAuthUser(
    authId: string,
    addUser: true,
  ): Promise<Auth & { user: User }>;
  async fetchAuthUser(authId: string, addUser: false): Promise<Auth>;

  async fetchAuthUser(authId: string, addUser: boolean = true): Promise<Auth> {
    const populate: Populate<Auth, 'user'> | undefined = addUser
      ? ['user']
      : [];

    const auth = await this.authRepo.findOne({ id: authId }, { populate });
    if (!auth) throw new UnauthorizedException('Auth not found');
    if (addUser && !auth.user)
      throw new BadRequestException('This auth is not linked to a user yet.');

    return addUser ? (auth as Auth & { user: User }) : auth;
  }

  private async handleAuthResponse(auth: Auth): Promise<AuthResponseType> {
    await this.em.persistAndFlush(auth);
    const access_token = await this.issueToken({
      sub: auth.id,
      role: auth.role,
      userId: auth.user?.id,
      anchorId: auth.anchor?.id,
    });

    const data: AuthResponseType = {
      access_token,
    };

    if (auth.anchor) data.anchor = auth.anchor;
    if (auth.user) data.user = auth.user;

    return data;
  }

  async sendEmailCode(dto: SendEMailCodeDto): Promise<void> {
    const { email } = dto;
    const now = new Date();
    const code = this.generateCode();
    let auth = await this.authRepo.findOne({ email });

    if (!auth) {
      auth = this.authRepo.create({ email, role: UserType.USER });
    }

    if (!this.isTimeWithin(auth?.lastCodeSentAt, 60_000)) {
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

  async verifyEmailCode(dto: VerifyEMailCodeDto): Promise<AuthResponseType> {
    const { email, code } = dto;
    const auth = await this.authRepo.findOne(
      { email },
      { populate: ['user', 'anchor'] },
    );

    const TEN_MINUTES = 60_000 * 10;

    if (
      !auth ||
      !auth?.emailCode ||
      !this.isTimeWithin(auth?.lastCodeSentAt, TEN_MINUTES) ||
      auth.emailCode !== code
    ) {
      throw new UnauthorizedException('Invalid user or verification code');
    }

    auth.emailCode = null;

    return this.handleAuthResponse(auth);
  }

  private async issueToken({
    sub,
    role,
    userId,
    anchorId,
  }: IssueTokenPayload): Promise<string> {
    const payload: IssueTokenPayload = {
      sub,
      role,
    };

    if (anchorId) {
      payload.anchorId = anchorId;
    }
    if (userId) {
      payload.userId = userId;
    }

    return await this.jwtService.signAsync(payload, {
      expiresIn: '60 days',
    });
  }

  async oauthLogin(dto: OAuthSignInDto): Promise<AuthResponseType> {
    const { provider, idToken } = dto;
    let res;

    if (provider === 'google') {
      res = await this.googleAuthService.verifyIdToken(idToken);
    } else if (provider === 'apple') {
      res = await this.appleAuthService.verifyIdToken(idToken);
    }

    if (!res || !res.email || !res.sub) {
      throw new UnauthorizedException('Invalid token or email not provided');
    }

    let auth = await this.authRepo.findOne({ email: res.email });
    if (!auth) {
      auth = this.authRepo.create({
        role: UserType.USER,
        email: res.email,
        ...(provider === 'google'
          ? { googleId: res.sub }
          : { appleId: res.sub }),
      });
    }

    return this.handleAuthResponse(auth);
  }

  async updatePushToken(authId: string, payload: PushTokenDto): Promise<void> {
    const auth = await this.authRepo.findOneOrFail({ id: authId });

    if (auth.pushToken !== payload.token) {
      auth.pushToken = payload.token;
      await this.em.flush();
    }
  }
}
