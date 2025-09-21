import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionType } from '../types/enums/other.enum';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DailyCountQueryDto {
  @IsEnum(InteractionType)
  type!: InteractionType;
}

export class CheckInteractionQueryDto {
  @IsEnum(InteractionType)
  type!: InteractionType;
}
