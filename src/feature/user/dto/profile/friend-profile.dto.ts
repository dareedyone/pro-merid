import { IsBoolean, IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFocusedIntentionDto } from '../focused-intention.dto';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFriendProfileDto {
  @IsInt()
  userId: number;

  @IsBoolean()
  bff: boolean;

  @IsBoolean()
  socialize: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFocusedIntentionDto)
  focusedIntentions: CreateFocusedIntentionDto[];
}

export class UpdateFriendProfileDto extends PartialType(
  CreateFriendProfileDto,
) {}
