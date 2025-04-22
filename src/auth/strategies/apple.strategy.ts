import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';

interface AppleProfile {
  email: string;
  name: { firstName: string; lastName: string };
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(configService: ConfigService) {
    const authenticationOptions = {
      clientID: configService.get<string>('APPLE_CLIENT_ID') || '',
      teamID: configService.get<string>('APPLE_TEAM_ID') || '',
      keyID: configService.get<string>('APPLE_KEY_ID') || '',
      key: configService.get<string>('APPLE_KEY_CONTENTS') || '',
      callbackURL: configService.get<string>('APPLE_REDIRECT_URI') || '',
      scope: ['email', 'name'],
      //   passReqToCallback: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(authenticationOptions);
  }

  validate(_accessToken: string, _refreshToken: string, profile: AppleProfile) {
    return {
      emailAddress: profile.email,
      firstName: profile.name?.firstName || '',
      lastName: profile.name?.lastName || '',
    };
  }
}
