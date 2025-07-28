import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import {
  DateIntention,
  DietaryPreference,
  LoveLanguageType,
  MaritalTimelineType,
} from 'src/common/types/enums/user.enum';
import { RhFactor, YesNo } from 'src/common/types/enums/other.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDatingFilterDto {
  @ValidateNested()
  @Type(() => RangeEmbDto)
  heightCm: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  bodyType: RangeEmbDto;

  @IsArray()
  @IsEnum(DateIntention, { each: true })
  intention: DateIntention[];

  @IsBoolean()
  isHeightVerified: boolean;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  religious: RangeEmbDto;

  @IsArray()
  @IsEnum(DietaryPreference, { each: true })
  diet: DietaryPreference[];

  @ValidateNested()
  @Type(() => RangeEmbDto)
  wantChildren: RangeEmbDto;

  @IsArray()
  @IsEnum(YesNo, { each: true })
  hasSickleCellTrait: YesNo[];

  @IsArray()
  @IsEnum(YesNo, { each: true })
  hasThalassemiaTrait: YesNo[];

  @IsArray()
  @IsEnum(RhFactor, { each: true })
  hasRhesusFactor: RhFactor[];

  @IsArray()
  @IsEnum(YesNo, { each: true })
  hasTaySachsTrait: YesNo[];

  @IsArray()
  @IsEnum(YesNo, { each: true })
  hasCysticFibrosisTrait: YesNo[];

  @IsArray()
  @IsEnum(YesNo, { each: true })
  hasG6pdDeficiency: YesNo[];

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
  upright: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  political: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  dressSense: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  relationshipBelief: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  intimacyBelief: RangeEmbDto;

  @IsOptional()
  @IsObject()
  feelLoveLanguage?: Partial<Record<LoveLanguageType, number>>;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  parentingStyle: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  spouseFriendship: RangeEmbDto;

  @IsEnum(MaritalTimelineType)
  maritalTimeline: MaritalTimelineType;

  @IsArray()
  @IsEnum(YesNo, { each: true })
  relocateForMarriage: YesNo[];

  @IsBoolean()
  personalityFirst: boolean;

  @IsInt()
  locationProfileId: number;
}

export class UpdateDateFilterDto extends PartialType(CreateDatingFilterDto) {}
