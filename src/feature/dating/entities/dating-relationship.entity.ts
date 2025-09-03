import {
  Entity,
  PrimaryKey,
  OneToOne,
  Property,
  Embedded,
} from '@mikro-orm/core';
import {
  IntimacyBeliefType,
  LoveLanguageType,
  MaritalTimelineType,
  ParentingStyleType,
  RelationshipBeliefType,
  RelocateForMarriage,
  SpouseFriendshipType,
} from 'src/common/types/enums/user.enum';
import { RangeEmb } from 'src/common/entities/range.emb';
import { DatingProfile } from './dating.profile';

@Entity()
export class DatingRelationship {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DatingProfile, (datingProfile) => datingProfile.personality)
  datingProfile!: DatingProfile;

  @Property({
    nullable: true,
  })
  belief?: RelationshipBeliefType;

  @Property({
    nullable: true,
  })
  intimacyBelief?: IntimacyBeliefType;

  @Property({ type: 'text[]', nullable: true })
  loveLanguage?: LoveLanguageType[];

  @Property({
    nullable: true,
  })
  parentingStyle?: ParentingStyleType;

  @Property({
    nullable: true,
  })
  spouseFriendship?: SpouseFriendshipType;

  @Property({
    nullable: true,
  })
  maritalTimeline?: MaritalTimelineType;

  @Embedded(() => RangeEmb, { nullable: true })
  wantChildren?: RangeEmb;

  // note: only use it to display the user sign for everyone, but in addition to that for paid use in filtering

  @Property({
    nullable: true,
  })
  relocateForMarriage?: RelocateForMarriage;
}
// DRD BIG TODO
// prompts later - AI ?
