import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  Length,
  IsPhoneNumber,
  IsUUID,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';

import {
  DietaryPreference,
  EducationLevel,
  Gender,
  MaritalStatus,
  ReligiousLevel,
  SexualOrientation,
  SubstanceStatus,
} from 'src/common/types/enums/user.enum';

export class CreateUserDto {
  @IsString()
  @Length(3, 100)
  firstName!: string;

  @IsString()
  @Length(3, 100)
  lastName!: string;

  @IsString()
  @Length(3, 100)
  displayName!: string;

  //   @IsDate()
  //   @Type(() => Date)
  //   dob!: Date;

  @IsDateString()
  dob: Date;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsInt()
  @IsOptional()
  professionId?: string;

  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @IsInt()
  @IsOptional()
  religionSectId?: string;

  @IsBoolean()
  @IsOptional()
  //   @Type(() => Number)
  isReligionConvert?: boolean;

  @IsEnum(ReligiousLevel)
  religiousLevel: ReligiousLevel;

  @IsInt()
  @IsOptional()
  ethnicityId?: string;

  @IsInt()
  @IsOptional()
  originCountryId?: string;

  @IsInt()
  @IsOptional()
  grewUpInId?: string;

  //   @IsOptional()
  //   @IsArray()
  //   @IsUUID(undefined, { each: true })
  //   nationalityId?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  nationalityIds?: string[];

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(SexualOrientation)
  sexualOrientation: SexualOrientation;

  @IsArray()
  @IsEnum(Gender, { each: true })
  interestedIn: Gender[];

  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  // Assume hasChildren is replaced with a range (e.g., min/max # of kids)
  @Transform(({ value }) => (value ? Number(value) : value))
  @IsOptional()
  @IsNumber()
  children?: number;

  //   @IsOptional()
  //   childrenMax?: number;

  //   And in your service or mapper:
  // user.hasChildren = new RangeEmb(dto.minChildren ?? 0, dto.maxChildren ?? 0);

  //   @ValidateNested()
  //   @Type(() => RangeEmb)
  //   hasChildren!: RangeEmb;

  @IsEnum(DietaryPreference)
  diet: DietaryPreference;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  interestIds?: string[];

  @IsOptional()
  @IsBoolean()
  faceVerified?: boolean;

  @IsEnum(SubstanceStatus)
  smokingStatus: SubstanceStatus;

  @IsEnum(SubstanceStatus)
  drinkingStatus: SubstanceStatus;

  @IsEnum(SubstanceStatus)
  drugUseStatus: SubstanceStatus;
}
