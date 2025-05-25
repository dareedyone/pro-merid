import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  StrategyOptions,
} from 'passport-google-oauth20';

interface GoogleProfile {
  emails: { value: string }[];
  name: { givenName: string; familyName: string };
  photos: { value: string }[];
}

// interface User {
//   email: string;
//   name: string;
// }

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const strategyOptions: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URI') || '',
      scope: ['email', 'profile'],
      // passReqToCallback: true,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(strategyOptions);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos } = profile;
    const user: Express.User = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    done(null, user);
  }
}
