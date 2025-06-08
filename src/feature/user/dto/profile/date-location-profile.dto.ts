import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMediaDto } from '../media.dto';
import { CreateBaseLocationProfileDto } from '../base-location-profile.dto';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDateLocationProfileDto extends CreateBaseLocationProfileDto {
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media: CreateMediaDto[];
}

export class UpdateDateLocationProfileDto extends PartialType(
  CreateDateLocationProfileDto,
) {}
