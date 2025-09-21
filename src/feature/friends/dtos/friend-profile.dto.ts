import { IsArray, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFriendProfileDto {
  @IsOptional()
  @IsBoolean()
  bff?: boolean;

  @IsOptional()
  @IsBoolean()
  socialize?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  focusedIntentions?: number[];
}

export class UpdateFriendProfileDto extends PartialType(
  CreateFriendProfileDto,
) {}
