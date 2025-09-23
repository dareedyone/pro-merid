import { IsArray, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateBaseLocationProfileDto } from 'src/common/dtos/base-location-profile.dto';

export class CreateFriendProfileDto extends CreateBaseLocationProfileDto {
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
