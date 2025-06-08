import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, IsArray } from 'class-validator';

export class CreateFriendFilterDto {
  @IsInt()
  locationProfileId: number;

  @IsBoolean()
  bff: boolean;

  @IsBoolean()
  socialize: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  focusedIntentions?: number[];
}

export class UpdateFriendFilterDto extends PartialType(CreateFriendFilterDto) {}
