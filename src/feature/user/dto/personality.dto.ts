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
  PrimaryGuidePhilosophy,
} from 'src/common/types/enums/user.enum';

export class CreatePersonalityDto {
  @IsEnum(FinancialAttitudeType)
  financialAttitude: FinancialAttitudeType;

  @IsEnum(HonestyType)
  honestLevel: HonestyType;

  @IsEnum(KindnessType)
  kindessLevel: KindnessType;

  @IsEnum(GenerousType)
  generousityLevel: GenerousType;

  @IsEnum(UprightnessType)
  uprightLevel: UprightnessType;

  @IsEnum(PoliticialView)
  politicalView: PoliticialView;

  @IsOptional()
  @IsEnum(DressSenseWomen)
  dressSenseWomen?: DressSenseWomen;

  @IsOptional()
  @IsEnum(DressSenseMen)
  dressSenseMen?: DressSenseMen;

  @IsOptional()
  @IsEnum(PrimaryGuidePhilosophy)
  primaryGuidePhilosophy?: PrimaryGuidePhilosophy;
}

export class UpdatePersonalityDto extends PartialType(CreatePersonalityDto) {}
