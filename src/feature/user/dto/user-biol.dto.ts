import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Genotype, YesNo, RhFactor } from 'src/common/types/enums/other.enum';
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

  @IsOptional()
  @IsEnum(Genotype)
  sickleCellGenotype?: Genotype;

  @IsEnum(YesNo)
  sickleCellTrait: YesNo;

  @IsEnum(YesNo)
  thalassemiaTrait: YesNo;

  @IsEnum(RhFactor)
  rhesusFactor: RhFactor;

  @IsEnum(YesNo)
  taySachsTrait: YesNo;

  @IsEnum(YesNo)
  cysticFibrosisTrait: YesNo;

  @IsEnum(YesNo)
  g6pdDeficiency: YesNo;
}

export class UpdateUserBiolDto extends PartialType(CreateUserBiolDto) {}
