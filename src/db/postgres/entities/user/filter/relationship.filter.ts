import {
  Entity,
  Property,
  ManyToOne,
  OneToOne,
  Enum,
  Embedded,
} from '@mikro-orm/core';
import { User } from '../user.entity';
import { BaseTimeEntity } from '../../generic/base.entity';
import { LocationProfile } from '../../profile/location.profile';
import {
  DietaryPreference,
  LoveLanguageType,
  MaritalStatus,
  MaritalTimelineType,
  RelationshipIntention,
} from 'src/types/enums/user.enum';
import { RhFactor, YesNo } from 'src/types/enums/other.enum';
import { RangeEmb } from '../../generic/range.emb';

@Entity()
export class FilterProfile extends BaseTimeEntity {
  @ManyToOne(() => User)
  user!: User;

  @OneToOne(
    () => LocationProfile,
    (locationProfile) => locationProfile.relationshipFilter,
  )
  locationProfile!: LocationProfile;

  @Embedded(() => RangeEmb)
  age = new RangeEmb(15, 150);

  // @Property({ default: 18 })
  // minAge!: number;

  // @Property({ default: 65 })
  // maxAge!: number;

  @Embedded(() => RangeEmb)
  heightCm = new RangeEmb(1, Infinity);

  @Embedded(() => RangeEmb)
  bodyType = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  smoking = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  drinking = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  drug = new RangeEmb(-1, 7);

  // @Property({ default: 0 })
  // minHeightCm: number;

  // @Property({ default: -1 })
  // minBodyType: number;

  // @Property({ default: 0 })
  // maxBodyType: number;

  // @Property({ default: -1 })
  // minSmoking: number;

  // @Property({ default: 7 })
  // maxSmoking: number;

  // @Property({ default: -1 })
  // minDrinking: number;

  // @Property({ default: 7 })
  // maxDrinking: number;

  // @Property({ default: -1 })
  // minDrug: number;

  // @Property({ default: 7 })
  // maxDrug: number;

  @Property({ type: 'int[]', nullable: true })
  restrictToProfessions?: number[];

  @Property({ type: 'int[]', nullable: true })
  excludeProfessions?: number[];

  // @Property({ default: -1 })
  // minEducation: number;

  // @Property({ default: 10 })
  // maxEducation: number;

  @Embedded(() => RangeEmb)
  education = new RangeEmb(-1, 10);

  @Property({ type: 'text[]' })
  maritalStatus: MaritalStatus[] = Object.values(MaritalStatus);

  @Property({ type: 'text[]' })
  relationshipIntention: RelationshipIntention[] = Object.values(
    RelationshipIntention,
  );

  @Property({ default: false, type: 'boolean' })
  isHeightVerified?: boolean = false;

  @Property({ default: false, type: 'boolean' })
  isVerified?: boolean = false;

  @Property({ type: 'int[]', nullable: true })
  originCountries?: number[];

  @Property({ type: 'int[]', nullable: true })
  grewupCountries?: number[];

  @Property({ type: 'int[]', nullable: true })
  nationalitiesOf?: number[];

  @Property({ type: 'int[]', nullable: true })
  ethniticities?: number[];

  @Property({ type: 'int[]', nullable: true })
  religions?: number[];

  @Property({ default: true, type: 'boolean' })
  allowReligionConvert?: boolean = true;

  @Property({ type: 'int[]', nullable: true })
  religionsSects?: number[];

  @Property({ type: 'int[]', nullable: true })
  interests?: number[];

  @Embedded(() => RangeEmb)
  religious = new RangeEmb(1, 5);

  // @Property({ default: 1 })
  // minReligious!: number;

  // @Property({ default: 5 })
  // maxReligious!: number;

  @Property({ type: 'text[]' })
  diet: DietaryPreference[] = Object.values(DietaryPreference);

  @Property({ type: 'text[]' })
  hasChildren: YesNo[] = Object.values(YesNo).filter(
    (item) => item !== YesNo.UNSURE,
  );

  @Property({ type: 'text[]' })
  wantChildren: YesNo[] = Object.values(YesNo);

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

  // @Property({ default: -1 })
  // minFinancialAttitude!: number;

  // @Property({ default: 4 })
  // maxFinancialAttitude!: number;

  // @Property({ default: -1 })
  // minHonesty!: number;

  // @Property({ default: 4 })
  // maxHonesty!: number;

  // @Property({ default: -1 })
  // minKindness!: number;

  // @Property({ default: 4 })
  // maxKindness!: number;

  // @Property({ default: -1 })
  // minGenerousity!: number;

  // @Property({ default: 4 })
  // maxGenerousity!: number;

  // @Property({ default: -1 })
  // minUpright!: number;

  // @Property({ default: 4 })
  // maxUpright!: number;

  // @Property({ default: -1 })
  // minPolitical!: number;

  // @Property({ default: 4 })
  // maxPolitical!: number;

  // @Property({ default: -1 })
  // minDressSense!: number;

  // @Property({ default: 6 })
  // maxDressSense!: number;

  // relationship

  @Embedded(() => RangeEmb)
  relationshipBelief = new RangeEmb(-1, 5);

  @Embedded(() => RangeEmb)
  intimacyBelief = new RangeEmb(-1, 3);

  // @Property({ default: -1 })
  // minRelationshipBelief!: number;

  // @Property({ default: 5 })
  // maxRelationshipBelief!: number;

  // @Property({ default: -1 })
  // minIntimacyBelief!: number;

  // @Property({ default: 3 })
  // maxIntimacyBelief!: number;

  @Property({ type: 'jsonb', nullable: true })
  feelLoveLanguage!: Partial<Record<LoveLanguageType, number>>;

  @Embedded(() => RangeEmb)
  parentingStyle = new RangeEmb(-1, 4);

  // @Property({ default: -1 })
  // minParentingStyle!: number;

  // @Property({ default: 4 })
  // maxParentingStyle!: number;

  @Enum({
    items: () => MaritalTimelineType,
    default: MaritalTimelineType.PREFER_NOT_TO_SAY,
  })
  maritalTimeline: MaritalTimelineType;

  @Property({ nullable: true })
  beliefAstronology?: boolean = false;

  @Property({ nullable: true })
  useAstronology?: boolean = false;
  // note: it is nullable because of unpaid user - it won't be used. If paid user false or true would be meaningful. e.g for who doesn't believe in it, it would be false

  @Property({ type: 'text[]' })
  relocateForMarriage: YesNo[] = Object.values(YesNo);

  // todo this can be called preference as opposed filter
  // note: didn't add gender filter or sexual orientation because that should be dynmically calculated based on user's profile - free or paid
}
