import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsObject } from 'class-validator';
import { LocationType } from 'src/common/types/enums/user.enum';

export class CreateBaseLocationProfileDto {
  @IsEnum(LocationType)
  type: LocationType; // todo: omit current due to flight mode

  @IsObject()
  coordinates: object;

  @IsBoolean()
  hidePictures: boolean;
}

export class UpdateBaseLocationProfileDto extends PartialType(
  CreateBaseLocationProfileDto,
) {}
