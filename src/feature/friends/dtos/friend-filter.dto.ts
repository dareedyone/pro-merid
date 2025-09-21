import { IsArray, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { BaseProfileFilterDto } from 'src/common/dtos/base-profile-filter.dto';

export class CreateFriendFilterDto extends BaseProfileFilterDto {
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

export class UpdateFriendFilterDto extends PartialType(CreateFriendFilterDto) {}
