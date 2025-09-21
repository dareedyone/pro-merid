import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import {
  DateIntention,
  DietaryPreference,
  RelocateForMarriage,
} from 'src/common/types/enums/user.enum';
import { RhFactor } from 'src/common/types/enums/other.enum';
import { PartialType } from '@nestjs/mapped-types';
import { BaseProfileFilterDto } from 'src/common/dtos/base-profile-filter.dto';

export class CreateDatingFilterDto extends BaseProfileFilterDto {
  @ValidateNested()
  @Type(() => RangeEmbDto)
  heightCm: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  bodyType: RangeEmbDto;

  @IsArray()
  @IsEnum(DateIntention, { each: true })
  intentions: DateIntention[];

  @IsBoolean()
  isHeightVerified: boolean;

  @IsArray()
  @IsEnum(DietaryPreference, { each: true })
  diet: DietaryPreference[];

  @ValidateNested()
  @Type(() => RangeEmbDto)
  wantChildren: RangeEmbDto;

  @IsOptional()
  @IsBoolean()
  excludeSickleCellTrait: boolean;

  @IsOptional()
  @IsBoolean()
  excludeSickleCellDisease: boolean;

  @IsOptional()
  @IsBoolean()
  excludeThalassemiaTrait: boolean;

  @IsOptional()
  @IsEnum(RhFactor)
  rhesusFactorIs: RhFactor;

  @IsOptional()
  @IsBoolean()
  excludeTaySachsTrait: boolean;

  @IsOptional()
  @IsBoolean()
  excludeCysticFibrosisTrait: boolean;

  @IsOptional()
  @IsBoolean()
  excludeG6pdDeficiency: boolean;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  financialAttitude: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  honesty: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  kindness: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  generousity: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  uprightness: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  politicalView: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  dressSense: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  relationshipBelief: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  intimacyBelief: RangeEmbDto;

  // @IsOptional()
  // @IsObject()
  // feelLoveLanguage?: Partial<Record<LoveLanguageType, number>>;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  parentingStyle: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  spouseFriendship: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  maritalTimeline: RangeEmbDto;

  @IsArray()
  @IsEnum(RelocateForMarriage, { each: true })
  relocateForMarriage: RelocateForMarriage[];
}

export class UpdateDateFilterDto extends PartialType(CreateDatingFilterDto) {
  @IsInt()
  locationProfile: string;
}
