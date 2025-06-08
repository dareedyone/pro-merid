import { IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBaseLocationProfileDto } from '../base-location-profile.dto';
import { CreateMediaDto } from '../media.dto';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFriendLocationProfileDto extends CreateBaseLocationProfileDto {
  @IsInt()
  friendProfileId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media: CreateMediaDto[];

  @IsInt()
  friendFilterId: number;
}

export class UpdateFriendLocationProfileDto extends PartialType(
  CreateFriendLocationProfileDto,
) {}
