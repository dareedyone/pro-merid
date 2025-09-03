import { Entity, Property, OneToOne, Embedded } from '@mikro-orm/core';
import { DatingLocationProfile } from './dating-location.profile';
import {
  DietaryPreference,
  // LoveLanguageType,
  DateIntention,
  RelocateForMarriage,
} from 'src/common/types/enums/user.enum';
import { RhFactor } from 'src/common/types/enums/other.enum';
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
  intentions?: DateIntention[];

  @Property({ default: false, type: 'boolean' })
  isHeightVerified?: boolean = false;

  @Property({ type: 'text[]' })
  diet?: DietaryPreference[];

  // @Property({ type: 'text[]' })
  // hasChildren: YesNo[] = Object.values(YesNo).filter(
  //   (item) => item !== YesNo.UNSURE,
  // );

  // @Property({ type: 'text[]' })
  // wantChildren: YesNo[] = Object.values(YesNo);

  // biological

  @Property({ default: false })
  excludeSickleCellTrait?: boolean;

  @Property({ default: false })
  excludeSickleCellDisease?: boolean;

  @Property({ default: false })
  excludeThalassemiaTrait?: boolean;

  @Property()
  rhesusFactorIs?: RhFactor;

  @Property({ default: false })
  excludeTaySachsTrait?: boolean;

  @Property({ default: false })
  excludeCysticFibrosisTrait?: boolean;

  @Property({ default: false })
  excludeG6pdDeficiency?: boolean;

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
  uprightness?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  politicalView?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  dressSense?: RangeEmb = new RangeEmb(-1, 6);

  // relationship

  @Embedded(() => RangeEmb, { nullable: true })
  relationshipBelief?: RangeEmb = new RangeEmb(-1, 5);

  @Embedded(() => RangeEmb, { nullable: true })
  intimacyBelief?: RangeEmb = new RangeEmb(-1, 3);

  // @Property({ type: 'jsonb', nullable: true })
  // feelLoveLanguage?: Partial<Record<LoveLanguageType, number>>;

  @Embedded(() => RangeEmb, { nullable: true })
  parentingStyle?: RangeEmb = new RangeEmb(-1, 4);

  @Embedded(() => RangeEmb, { nullable: true })
  spouseFriendship?: RangeEmb = new RangeEmb(-1, 3);

  @Embedded(() => RangeEmb, { nullable: true })
  wantChildren?: RangeEmb = new RangeEmb(1, 5);

  @Embedded(() => RangeEmb, { nullable: true })
  maritalTimeline?: RangeEmb = new RangeEmb(-1, 4);

  @Property({ type: 'text[]' })
  relocateForMarriage?: RelocateForMarriage[];

  // note: didn't add gender filter or sexual orientation because that should be dynmically calculated based on user's profile - free or paid
}
