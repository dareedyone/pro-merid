import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  Length,
  IsPhoneNumber,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';

import {
  DietaryPreference,
  EducationLevel,
  Gender,
  MaritalStatus,
  PetPreference,
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
  professionId?: number;

  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @IsInt()
  @IsOptional()
  religionSectId?: number;

  @IsBoolean()
  @IsOptional()
  //   @Type(() => Number)
  isReligionConvert?: boolean;

  @IsEnum(ReligiousLevel)
  religiousLevel: ReligiousLevel;

  @IsInt()
  @IsOptional()
  ethnicId?: number;

  @IsInt()
  @IsOptional()
  originCountryId?: number;

  @IsInt()
  @IsOptional()
  grewUpInId?: number;

  //   @IsOptional()
  //   @IsArray()
  //   @IsUUID(undefined, { each: true })
  //   nationalityId?: string[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  nationalityIds?: number[];

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(SexualOrientation)
  sexualOrientation: SexualOrientation;

  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @IsOptional()
  @IsEnum(PetPreference)
  petPreference: PetPreference;

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
  // @IsUUID('all', { each: true })
  @IsInt({ each: true })
  @IsOptional()
  interestIds?: number[];

  // @IsOptional()
  // @IsBoolean()
  // faceVerified?: boolean;

  @IsEnum(SubstanceStatus)
  smokingStatus: SubstanceStatus;

  @IsEnum(SubstanceStatus)
  drinkingStatus: SubstanceStatus;

  @IsEnum(SubstanceStatus)
  drugUseStatus: SubstanceStatus;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['firstName', 'lastName', 'dob'] as const),
) {
  //     // You can redefine or override fields here
  //   @IsString()
  //   @Length(3, 50)
  //   displayName?: string;
  //   // Or add new fields
  //   @IsUUID()
  //   @IsOptional()
  //   someOtherId?: string;
}
