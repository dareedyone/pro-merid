import { IsNumber } from 'class-validator';

export class RangeEmbDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}
