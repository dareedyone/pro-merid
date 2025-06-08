import { IsEnum, IsArray } from 'class-validator';
import { DateIntention, Gender } from 'src/common/types/enums/user.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDateProfileDto {
  @IsEnum(DateIntention)
  intention: DateIntention;

  @IsArray()
  @IsEnum(Gender, { each: true })
  interestedIn: Gender[];
}

export class UpdateDateProfileDto extends PartialType(CreateDateProfileDto) {}
