import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { RhFactor } from 'src/common/types/enums/other.enum';
import { BodyType } from 'src/common/types/enums/user.enum';

export class CreateUserBiolDto {
  @IsOptional()
  @IsNumber()
  claimedHeightCm?: number;

  // @IsOptional()
  // @IsNumber()
  // measuredHeightCm?: number;

  @IsEnum(BodyType)
  bodyType: BodyType;

  // @IsOptional()
  // @IsEnum(Genotype)
  // sickleCellGenotype?: Genotype;

  @IsOptional()
  sickleCellTrait?: boolean;

  @IsOptional()
  sickleCellDisease?: boolean;

  @IsOptional()
  thalassemiaTrait?: boolean;

  @IsOptional()
  rhesusFactor?: RhFactor;

  @IsOptional()
  taySachsTrait?: boolean;

  @IsOptional()
  cysticFibrosisTrait?: boolean;

  @IsOptional()
  g6pdDeficiency?: boolean;
}

export class UpdateUserBiolDto extends PartialType(CreateUserBiolDto) {}
