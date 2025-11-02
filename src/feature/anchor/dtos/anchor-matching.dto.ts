import {
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import {
  Gender,
  MaritalStatus,
  PrimaryGuidePhilosophy,
  DietaryPreference,
  DateIntention,
  RelocateForMarriage,
} from 'src/common/types/enums/user.enum';
import { RhFactor } from 'src/common/types/enums/other.enum';

export class AnchorMatchingOptionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeUserIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  age?: RangeEmbDto;

  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  gendersInterestedIn?: Gender[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  education?: RangeEmbDto;

  @IsOptional()
  @IsArray()
  @IsEnum(MaritalStatus, { each: true })
  maritalStatus?: MaritalStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(PrimaryGuidePhilosophy, { each: true })
  primaryGuidePhilosophy?: PrimaryGuidePhilosophy[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  restrictToProfessions?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  excludeProfessions?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  originCountries?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  grewupCountries?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  nationalitiesOf?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  basedInCountries?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ethniticities?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  religions?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  religionsSects?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  religiousLevel?: RangeEmbDto;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  interests?: number[];

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;

  // Dating-specific filters
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  heightCm?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  bodyType?: RangeEmbDto;

  @IsOptional()
  @IsArray()
  @IsEnum(DateIntention, { each: true })
  intentions?: DateIntention[];

  @IsOptional()
  @IsArray()
  @IsEnum(DietaryPreference, { each: true })
  diet?: DietaryPreference[];

  @IsOptional()
  @IsArray()
  @IsEnum(RelocateForMarriage, { each: true })
  relocateForMarriage?: RelocateForMarriage[];

  @IsOptional()
  @IsEnum(RhFactor)
  rhesusFactorIs?: RhFactor;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  financialAttitude?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  honesty?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  kindness?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  generousity?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  uprightness?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  politicalView?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  dressSense?: RangeEmbDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RangeEmbDto)
  cleanliness?: RangeEmbDto;

  @IsOptional()
  @IsBoolean()
  personalityFirst?: boolean;
}
