import { Entity, PrimaryKey, OneToOne, Enum, Property } from '@mikro-orm/core';
import { User } from './user.entity';
import {
  IntimacyBeliefType,
  LoveLanguageType,
  MaritalTimelineType,
  ParentingStyleType,
  RelationshipBeliefType,
  SpouseFriendshipType,
} from 'src/common/types/enums/user.enum';
import { YesNo } from 'src/common/types/enums/other.enum';
import { DateProfile } from '../profile/date.profile';

@Entity()
export class Relationship {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DateProfile, (dateProfile) => dateProfile.personality)
  dateProfile!: User;

  @Enum({
    items: () => RelationshipBeliefType,
    default: RelationshipBeliefType.PREFER_NOT_TO_SAY,
  })
  belief: RelationshipBeliefType;

  @Enum({
    items: () => IntimacyBeliefType,
    default: IntimacyBeliefType.PREFER_NOT_TO_SAY,
  })
  intimacyBelief: IntimacyBeliefType;

  @Property({ type: 'jsonb', nullable: true })
  expressLoveLanguage!: Partial<Record<LoveLanguageType, number>>;

  @Enum({
    items: () => ParentingStyleType,
    default: ParentingStyleType.PREFER_NOT_TO_SAY,
  })
  parentingStyle: ParentingStyleType;

  @Enum({
    items: () => SpouseFriendshipType,
    default: SpouseFriendshipType.PREFER_NOT_TO_SAY,
  })
  spouseFriendship: SpouseFriendshipType;

  @Enum({
    items: () => MaritalTimelineType,
    default: MaritalTimelineType.PREFER_NOT_TO_SAY,
  })
  maritalTimeline: MaritalTimelineType;

  @Enum({
    items: () => YesNo,
    default: YesNo.UNSURE,
  })
  astronology: YesNo;

  // note: only use it to display the user sign for everyone, but in addition to that for paid use in filtering

  @Enum({
    items: () => YesNo,
    default: YesNo.UNSURE,
  })
  relocateForMarriage: YesNo;
}

// report if inaccurate feature -- goes to support - todo
// rest of friends profile
// chats and groups - micro - general
// events
// prompts
// anchors
