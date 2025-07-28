import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsNotEmptyObject,
  IsInt,
  ValidateNested,
  IsString,
} from 'class-validator';

export class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  altitude: number | null;

  @IsNumber()
  accuracy: number;

  @IsOptional()
  @IsNumber()
  altitudeAccuracy: number | null;

  @IsNumber()
  heading: number;

  @IsNumber()
  speed: number;
}

export class ExpoLocationDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coords: CoordinatesDto;

  @IsInt()
  timestamp: number;
}

export class ExpoAddressDto {
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  @IsOptional()
  @IsString()
  city?: string;

  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  @IsOptional()
  @IsString()
  country?: string;

  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  @IsOptional()
  @IsString()
  district?: string;

  @Transform(({ value }) => (value ? value.toUpperCase() : value))
  @IsOptional()
  @IsString()
  isoCountryCode?: string;

  // @IsOptional()
  // @IsString()
  // name?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  @IsOptional()
  @IsString()
  subregion?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ExpoLocationAddressDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  isoCountryCode?: string;
}
