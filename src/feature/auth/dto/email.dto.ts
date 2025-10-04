import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';

export class SendEMailCodeDto {
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email: string;
}

export class VerifyEMailCodeDto {
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email: string;

  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ''))
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 characters' })
  @Matches(/^[0-9]+$/, {
    message: 'Verification code must contain only digits',
  })
  code: string;
}

export interface AuthResponseType {
  access_token: string;
  user?: User;
  anchor?: Anchor;
}
