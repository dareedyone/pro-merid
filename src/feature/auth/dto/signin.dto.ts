import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';
import { UserType } from 'src/common/types/enums/user.enum';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsIn(['user', 'admin', 'anchor'])
  userType: UserType;
}
