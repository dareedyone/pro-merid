import { IsString } from 'class-validator';

export class PushTokenDto {
  @IsString()
  token: string;

  // @IsEnum('ios', 'android')
  // platform: 'ios' | 'android';

  // @IsOptional()
  // @IsBoolean()
  // isActive?: boolean = true;

  // @IsOptional()
  // @IsDateString()
  // lastUsedAt?: Date;
}
