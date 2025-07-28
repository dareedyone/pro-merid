import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  ValidateIf,
  Min,
  IsString,
} from 'class-validator';
import { MAX_PROFILE_PICTURE } from '../contant';

@ValidatorConstraint({ name: 'MaxFiles', async: false })
export class MaxFilesConstraint implements ValidatorConstraintInterface {
  validate(mediaItems: CreateMediaDto[], args: ValidationArguments): boolean {
    const maxFiles = parseInt(process.env[MAX_PROFILE_PICTURE] ?? '5', 10);
    return Array.isArray(mediaItems) && mediaItems.length <= maxFiles;
  }

  defaultMessage(args: ValidationArguments): string {
    const max = process.env.MAX_PROFILE_PICTURES ?? '5';
    return `You can upload at most ${max} profile pictures.`;
  }
}
// replace: id , file
// order: id, order
//
export class CreateMediaDto {
  @IsInt()
  order: number;

  @ValidateIf((o) => o.file !== undefined)
  @IsNotEmpty()
  file: Express.Multer.File;
}

export class UpdateMediaDto {
  @IsString()
  @IsNotEmpty()
  locationProfileId: string;

  @IsInt()
  mediaId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  reOrder: number;

  @IsOptional()
  @ValidateIf((o) => o.file !== undefined)
  @IsNotEmpty()
  file: Express.Multer.File;
}

export class RemoveMediaDto {
  @IsString()
  @IsNotEmpty()
  locationProfileId: string;

  @IsInt()
  mediaId: number;
}

export class CreateLocationProfileMediaDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => value?.toString())
  locationProfileId: string;

  @Validate(MaxFilesConstraint)
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  profilePictures: CreateMediaDto[];

  @IsOptional()
  selfie: Express.Multer.File;
}

export class UpdateLocationProfileMediaDto extends PartialType(
  CreateLocationProfileMediaDto,
) {}
