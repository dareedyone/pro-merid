import { IsEnum, IsArray } from 'class-validator';
import { DateIntention, Gender } from 'src/common/types/enums/user.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDatingProfileDto {
  @IsEnum(DateIntention)
  intention: DateIntention;

  @IsArray()
  @IsEnum(Gender, { each: true })
  interestedIn: Gender[];
}

export class UpdateDatingProfileDto extends PartialType(
  CreateDatingProfileDto,
) {}
