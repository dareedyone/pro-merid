import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
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
  RelocateForMarriage,
} from 'src/common/types/enums/user.enum';

export class CreateDatingRelationshipDto {
  @IsEnum(RelationshipBeliefType)
  belief: RelationshipBeliefType;

  @IsEnum(IntimacyBeliefType)
  intimacyBelief: IntimacyBeliefType;

  @IsOptional()
  @IsArray()
  @IsEnum(LoveLanguageType, { each: true })
  loveLanguage: LoveLanguageType[];

  @IsEnum(ParentingStyleType)
  parentingStyle: ParentingStyleType;

  @IsEnum(SpouseFriendshipType)
  spouseFriendship: SpouseFriendshipType;

  @IsEnum(MaritalTimelineType)
  maritalTimeline: MaritalTimelineType;

  @IsEnum(YesNo)
  astronology: YesNo;

  @IsEnum(RelocateForMarriage)
  relocateForMarriage: RelocateForMarriage;

  @ValidateNested()
  @IsOptional()
  @TransformType(() => RangeEmbDto)
  wantChildren: RangeEmbDto;
}

export class UpdateDatingRelationshipDto extends PartialType(
  CreateDatingRelationshipDto,
) {}
