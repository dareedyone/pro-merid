import { Entity, Property, OneToOne, Enum, Embedded } from '@mikro-orm/core';
import { DateLocationProfile } from '../../profile/date-location.profile';
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
export class DateFilter extends BaseProfileFilter {
  @OneToOne(
    () => DateLocationProfile,
    (locationProfile) => locationProfile.dateFilter,
  )
  locationProfile!: DateLocationProfile;

  @Embedded(() => RangeEmb)
  heightCm = new RangeEmb(1, Infinity);

  @Embedded(() => RangeEmb)
  bodyType = new RangeEmb(-1, 7);

  @Property({ type: 'text[]' })
  intention: DateIntention[] = Object.values(DateIntention);

  @Property({ default: false, type: 'boolean' })
  isHeightVerified?: boolean = false;

  @Embedded(() => RangeEmb)
  religious = new RangeEmb(1, 5);

  @Property({ type: 'text[]' })
  diet: DietaryPreference[] = Object.values(DietaryPreference);

  // @Property({ type: 'text[]' })
  // hasChildren: YesNo[] = Object.values(YesNo).filter(
  //   (item) => item !== YesNo.UNSURE,
  // );

  @Embedded(() => RangeEmb)
  wantChildren = new RangeEmb(1, 5);

  // @Property({ type: 'text[]' })
  // wantChildren: YesNo[] = Object.values(YesNo);

  // biological

  @Property({ type: 'text[]' })
  hasSickleCellTrait: YesNo[] = Object.values(YesNo);

  @Property({ type: 'text[]' })
  hasThalassemiaTrait: YesNo[] = Object.values(YesNo);

  @Property({ type: 'text[]' })
  hasRhesusFactor: RhFactor[] = Object.values(RhFactor);

  @Property({ type: 'text[]' })
  hasTaySachsTrait: YesNo[] = Object.values(YesNo);

  @Property({ type: 'text[]' })
  hasCysticFibrosisTrait: YesNo[] = Object.values(YesNo);

  @Property({ type: 'text[]' })
  hasG6pdDeficiency: YesNo[] = Object.values(YesNo);

  // personality

  @Embedded(() => RangeEmb)
  financialAttitude = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  honesty = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  kindness = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  generousity = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  upright = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  political = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  dressSense = new RangeEmb(-1, 6);

  // relationship

  @Embedded(() => RangeEmb)
  relationshipBelief = new RangeEmb(-1, 5);

  @Embedded(() => RangeEmb)
  intimacyBelief = new RangeEmb(-1, 3);

  @Property({ type: 'jsonb', nullable: true })
  feelLoveLanguage!: Partial<Record<LoveLanguageType, number>>;

  @Embedded(() => RangeEmb)
  parentingStyle = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb)
  spouseFriendship = new RangeEmb(-1, 3);

  @Enum({
    items: () => MaritalTimelineType,
    default: MaritalTimelineType.PREFER_NOT_TO_SAY,
  })
  maritalTimeline: MaritalTimelineType;

  @Property({ type: 'text[]' })
  relocateForMarriage: YesNo[] = Object.values(YesNo);

  @Property({ default: false })
  personalityFirst: boolean = false;

  // note: didn't add gender filter or sexual orientation because that should be dynmically calculated based on user's profile - free or paid
}
