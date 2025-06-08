import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

export class CreateFocusedIntentionDto {
  @IsString()
  name: string;

  @IsString()
  emoji: string;
}

export class UpdateFocusedIntentionDto extends PartialType(
  CreateFocusedIntentionDto,
) {}
