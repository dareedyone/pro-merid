import { IsString, IsIn } from 'class-validator';

export class OAuthSignInDto {
  // @IsEmail()
  // email: string;

  @IsString()
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  @IsString()
  idToken: string;
}
