import { IsEnum, IsArray, IsBoolean, IsOptional } from 'class-validator';
import { DateIntention, Gender } from 'src/common/types/enums/user.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDatingProfileDto {
  @IsEnum(DateIntention)
  intention: DateIntention;

  @IsArray()
  @IsEnum(Gender, { each: true })
  gendersInterestedIn: Gender[];

  @IsOptional()
  @IsBoolean()
  personalityFirst?: boolean;
}

export class UpdateDatingProfileDto extends PartialType(
  CreateDatingProfileDto,
) {}
