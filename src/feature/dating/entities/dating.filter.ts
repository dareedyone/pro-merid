import { Entity, Property, OneToOne, Enum, Embedded } from '@mikro-orm/core';
import { DatingLocationProfile } from './dating-location.profile';
import {
  DietaryPreference,
  LoveLanguageType,
  MaritalTimelineType,
  DateIntention,
} from 'src/common/types/enums/user.enum';
import { RhFactor, YesNo } from 'src/common/types/enums/other.enum';
import { BaseProfileFilter } from 'src/common/entities/base.profile-filter';
import { RangeEmb } from 'src/common/entities/range.emb';

@Entity()
export class DatingFilter extends BaseProfileFilter {
  @OneToOne(
    () => DatingLocationProfile,
    (locationProfile) => locationProfile.datingFilter,
  )
  locationProfile!: DatingLocationProfile;

  @Embedded(() => RangeEmb, { nullable: true })
  heightCm?: RangeEmb = new RangeEmb(1, Infinity);

  @Embedded(() => RangeEmb, { nullable: true })
  bodyType?: RangeEmb = new RangeEmb(-1, 7);

  @Property({ type: 'text[]' })
  intention?: DateIntention[];

  @Property({ default: false, type: 'boolean' })
  isHeightVerified?: boolean = false;

  @Embedded(() => RangeEmb, { nullable: true })
  religious?: RangeEmb = new RangeEmb(1, 5);

  @Property({ type: 'text[]' })
  diet?: DietaryPreference[];

  // @Property({ type: 'text[]' })
  // hasChildren: YesNo[] = Object.values(YesNo).filter(
  //   (item) => item !== YesNo.UNSURE,
  // );

  @Embedded(() => RangeEmb, { nullable: true })
  wantChildren?: RangeEmb = new RangeEmb(1, 5);

  // @Property({ type: 'text[]' })
  // wantChildren: YesNo[] = Object.values(YesNo);

  // biological

  @Property({ type: 'text[]' })
  hasSickleCellTrait?: YesNo[];

  @Property({ type: 'text[]' })
  hasThalassemiaTrait?: YesNo[];

  @Property({ type: 'text[]' })
  hasRhesusFactor?: RhFactor[];

  @Property({ type: 'text[]' })
  hasTaySachsTrait?: YesNo[];

  @Property({ type: 'text[]' })
  hasCysticFibrosisTrait?: YesNo[];

  @Property({ type: 'text[]' })
  hasG6pdDeficiency?: YesNo[];

  // personality

  @Embedded(() => RangeEmb, { nullable: true })
  financialAttitude?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  honesty?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  kindness?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  generousity?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  upright?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  political?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  dressSense?: RangeEmb = new RangeEmb(-1, 6);

  // relationship

  @Embedded(() => RangeEmb, { nullable: true })
  relationshipBelief?: RangeEmb = new RangeEmb(-1, 5);

  @Embedded(() => RangeEmb, { nullable: true })
  intimacyBelief?: RangeEmb = new RangeEmb(-1, 3);

  @Property({ type: 'jsonb', nullable: true })
  feelLoveLanguage?: Partial<Record<LoveLanguageType, number>>;

  @Embedded(() => RangeEmb, { nullable: true })
  parentingStyle?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  spouseFriendship?: RangeEmb = new RangeEmb(-1, 3);

  @Enum({
    items: () => MaritalTimelineType,
    default: MaritalTimelineType.PREFER_NOT_TO_SAY,
  })
  maritalTimeline?: MaritalTimelineType;

  @Property({ type: 'text[]' })
  relocateForMarriage?: YesNo[];

  @Property({ default: false })
  personalityFirst?: boolean;

  // note: didn't add gender filter or sexual orientation because that should be dynmically calculated based on user's profile - free or paid
}
