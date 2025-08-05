import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { RangeEmbDto } from './range-emb-.dto';
import { MaritalStatus } from '../types/enums/user.enum';

export class BaseProfileFilterDto {
  @ValidateNested()
  @Type(() => RangeEmbDto)
  age: RangeEmbDto;

  @IsBoolean()
  isVerified: boolean;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  smoking: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  drinking: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  drug: RangeEmbDto;

  @ValidateNested()
  @Type(() => RangeEmbDto)
  education: RangeEmbDto;

  @IsArray()
  @IsEnum(MaritalStatus, { each: true })
  maritalStatus: MaritalStatus[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  restrictToProfessions?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  excludeProfessions?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  originCountries?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  grewupCountries?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  nationalitiesOf?: number[];

  @IsInt()
  maxDistanceMile?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ethniticities?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  religions?: number[];

  @IsBoolean()
  allowReligionConvert: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  religionsSects?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  interests?: number[];

  @ValidateNested()
  @Type(() => RangeEmbDto)
  hasChildren: RangeEmbDto;

  @IsOptional()
  @IsBoolean()
  beliefAstronology?: boolean;

  @IsOptional()
  @IsBoolean()
  useAstronology?: boolean;
}
