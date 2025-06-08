import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type as TransformType } from 'class-transformer';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import { YesNo } from 'src/common/types/enums/other.enum';
import {
  RelationshipBeliefType,
  IntimacyBeliefType,
  LoveLanguageType,
  ParentingStyleType,
  SpouseFriendshipType,
  MaritalTimelineType,
} from 'src/common/types/enums/user.enum';

export class CreateRelationshipDto {
  @IsEnum(RelationshipBeliefType)
  belief: RelationshipBeliefType;

  @IsEnum(IntimacyBeliefType)
  intimacyBelief: IntimacyBeliefType;

  @IsOptional()
  @IsObject()
  expressLoveLanguage?: Partial<Record<LoveLanguageType, number>>;

  @IsEnum(ParentingStyleType)
  parentingStyle: ParentingStyleType;

  @IsEnum(SpouseFriendshipType)
  spouseFriendship: SpouseFriendshipType;

  @IsEnum(MaritalTimelineType)
  maritalTimeline: MaritalTimelineType;

  @IsEnum(YesNo)
  astronology: YesNo;

  @IsEnum(YesNo)
  relocateForMarriage: YesNo;

  @ValidateNested()
  @IsOptional()
  @TransformType(() => RangeEmbDto)
  wantChildren: RangeEmbDto;
}

export class UpdateRelationshipDto extends PartialType(CreateRelationshipDto) {}
