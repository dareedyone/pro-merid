// // import { IsArray, IsInt, IsOptional } from 'class-validator';
// // import { CreateBaseLocationProfileDto } from './base-location-profile.dto';
// // import { PartialType } from '@nestjs/mapped-types';

// // export class CreateDateLocationProfileDto extends CreateBaseLocationProfileDto {
// //   // @ValidateNested({ each: true })
// //   // @Type(() => CreateMediaDto)
// //   // media: CreateMediaDto[];
// // }

// // export class UpdateLocationProfileDto extends PartialType(
// //   CreateDateLocationProfileDto,
// // ) {}

// // // export class CreateDateLocationProfileDto extends CreateBaseLocationProfileDto {
// // //   @IsArray()
// // //   @IsInt({ each: true })
// // //   @IsOptional()
// // //   mediaIds?: number[];
// // // }

// // export class UpdateDateLocationProfileDto extends PartialType(
// //   CreateDateLocationProfileDto,
// // ) {}

// import { PartialType } from '@nestjs/mapped-types';
// import { Type } from 'class-transformer';
// import {
//   IsBoolean,
//   IsEnum,
//   IsInt,
//   IsNotEmptyObject,
//   IsOptional,
//   ValidateNested,
// } from 'class-validator';
// import { LocationType } from 'src/common/types/enums/user.enum';
// import {
//   ExpoAddressDto,
//   ExpoLocationDto,
// } from 'src/feature/location/dto/expo.location';
// import { CreateMediaDto } from '../../../common/dtos/location-media.dto';

// export class CreateDatingLocationProfileDto {
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

// export class UpdateDatingLocationProfileDto extends PartialType(
//   CreateDatingLocationProfileDto,
// ) {}

// export class UpdateDatingLocationProfileDto extends PartialType(
//   CreateDatingLocationProfileDto,
// ) {}
