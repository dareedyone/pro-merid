import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FileType } from 'src/common/types/enums/other.enum';

export class CreateMediaDto {
  @IsInt()
  id: number;

  @IsInt()
  userId: number;

  @IsInt()
  @IsOptional()
  dateLocationProfileId: number;

  @IsInt()
  @IsOptional()
  friendLocationProfileId: number;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(FileType)
  fileType: FileType;

  @IsInt()
  order: number;
}

export class UpdateMediaDto extends PartialType(CreateMediaDto) {}
