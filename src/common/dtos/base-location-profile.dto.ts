// import { PartialType } from '@nestjs/mapped-types';
// import { Type } from 'class-transformer';
// import {
//   IsBoolean,
//   IsEnum,
//   IsNotEmptyObject,
//   IsOptional,
//   ValidateNested,
// } from 'class-validator';
// import { LocationType } from 'src/common/types/enums/user.enum';
// import {
//   ExpoAddressDto,
//   ExpoLocationDto,
// } from 'src/feature/location/dto/expo.location';

// export class CreateBaseLocationProfileDto {
//   @IsEnum(LocationType)
//   type: LocationType; // todo: omit current due to flight mode

//   // @IsObject()
//   // coordinates: object;

//   @IsNotEmptyObject()
//   @ValidateNested()
//   @Type(() => ExpoLocationDto)
//   location: ExpoLocationDto;

//   @IsNotEmptyObject()
//   @ValidateNested()
//   @Type(() => ExpoAddressDto)
//   address: ExpoAddressDto;

//   @IsOptional()
//   @IsBoolean()
//   hidePictures: boolean;
// }

// export class UpdateBaseLocationProfileDto extends PartialType(
//   CreateBaseLocationProfileDto,
// ) {}

// import { IsArray, IsInt, IsOptional } from 'class-validator';
// import { CreateBaseLocationProfileDto } from './base-location-profile.dto';
// import { PartialType } from '@nestjs/mapped-types';

// export class CreateDateLocationProfileDto extends CreateBaseLocationProfileDto {
//   // @ValidateNested({ each: true })
//   // @Type(() => CreateMediaDto)
//   // media: CreateMediaDto[];
// }

// export class UpdateLocationProfileDto extends PartialType(
//   CreateDateLocationProfileDto,
// ) {}

// // export class CreateDateLocationProfileDto extends CreateBaseLocationProfileDto {
// //   @IsArray()
// //   @IsInt({ each: true })
// //   @IsOptional()
// //   mediaIds?: number[];
// // }

// export class UpdateDateLocationProfileDto extends PartialType(
//   CreateDateLocationProfileDto,
// ) {}

import { PartialType, PickType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { LocationType } from 'src/common/types/enums/user.enum';
import {
  ExpoAddressDto,
  ExpoLocationDto,
} from 'src/feature/location/dto/expo.location';
// import { CreateMediaDto } from '../../../common/dtos/location-media.dto';

export class CreateBaseLocationProfileDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ExpoLocationDto)
  location: ExpoLocationDto;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ExpoAddressDto)
  address: ExpoAddressDto;
}

export class CreateLocationProfileDto extends CreateBaseLocationProfileDto {
  @IsEnum(LocationType)
  type: LocationType; // todo: omit current due to flight mode

  @IsOptional()
  @IsBoolean()
  hidePictures: boolean;
}

export class UpdateLocationProfileDto extends PartialType(
  CreateLocationProfileDto,
) {}

export class UpdateProfileLocationDto extends PickType(
  CreateLocationProfileDto,
  ['location', 'address'],
) {
  @IsNotEmpty()
  locationProfileId: string;

  @IsOptional()
  @IsBoolean()
  pinLocation?: boolean;
}
