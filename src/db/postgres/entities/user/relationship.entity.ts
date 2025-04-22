import { Entity, PrimaryKey, OneToOne, Enum, Property } from '@mikro-orm/core';
import { User } from './user.entity';
import {
  IntimacyBeliefType,
  LoveLanguageType,
  MaritalTimelineType,
  ParentingStyleType,
  // PartnerIntimacyPreferenceType,
  RelationshipBeliefType,
  // WantsKidsType,
} from 'src/types/enums/user.enum';
import { YesNo } from 'src/types/enums/other.enum';

@Entity()
export class Relationship {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => User, (user) => user.personality)
  user!: User;

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

  // @Enum({
  //   items: () => PartnerIntimacyPreferenceType,
  //   default: PartnerIntimacyPreferenceType.PREFER_NOT_TO_SAY,
  // })
  // partnerIntimacyBelief: PartnerIntimacyPreferenceType; // to

  // @Property({ type: 'jsonb', nullable: true })
  // feelLovedLanguage!: Partial<Record<LoveLanguageType, number>>;

  // todo consider puting the rest i.e feeled on filter

  @Property({ type: 'jsonb', nullable: true })
  expressLoveLanguage!: Partial<Record<LoveLanguageType, number>>;

  // @Enum({
  //   items: () => WantsKidsType,
  //   default: WantsKidsType.PREFER_NOT_TO_SAY,
  // })
  // kidsWanted: WantsKidsType;

  @Enum({
    items: () => ParentingStyleType,
    default: ParentingStyleType.PREFER_NOT_TO_SAY,
  })
  parentingStyle: ParentingStyleType;

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
