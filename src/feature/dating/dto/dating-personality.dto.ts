import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import {
  FinancialAttitudeType,
  HonestyType,
  KindnessType,
  GenerousType,
  UprightnessType,
  PoliticialView,
  DressSenseWomen,
  DressSenseMen,
} from 'src/common/types/enums/user.enum';

export class CreateDatingPersonalityDto {
  @IsEnum(FinancialAttitudeType)
  financialAttitude: FinancialAttitudeType;

  @IsEnum(HonestyType)
  honesty: HonestyType;

  @IsEnum(KindnessType)
  kindess: KindnessType;

  @IsEnum(GenerousType)
  generousity: GenerousType;

  @IsEnum(UprightnessType)
  uprightness: UprightnessType;

  @IsEnum(PoliticialView)
  politicalView: PoliticialView;

  @IsOptional()
  @IsEnum(DressSenseWomen)
  dressSenseWomen?: DressSenseWomen;

  @IsOptional()
  @IsEnum(DressSenseMen)
  dressSenseMen?: DressSenseMen;
}

export class UpdateDatingPersonalityDto extends PartialType(
  CreateDatingPersonalityDto,
) {}
