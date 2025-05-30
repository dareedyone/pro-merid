import { IsEmail } from 'class-validator';

export class SendTokenDto {
  @IsEmail()
  email: string;
}
