import { Entity, Property, ManyToOne, Embedded } from '@mikro-orm/core';
import {
  Gender,
  MaritalStatus,
  PrimaryGuidePhilosophy,
} from 'src/common/types/enums/user.enum';
// import { YesNo } from 'src/types/enums/other.enum';
import { BaseTimeEntity } from './base.entity';
import { RangeEmb } from './range.emb';
import { User } from 'src/feature/user/entities/user/user.entity';

@Entity()
export abstract class BaseProfileFilter extends BaseTimeEntity {
  @ManyToOne(() => User)
  user!: User;

  @Embedded(() => RangeEmb, {
    nullable: true,
  })
  age?: RangeEmb = new RangeEmb(18, 100);

  @Property({ type: 'text[]' })
  primaryGuidePhilosophy?: PrimaryGuidePhilosophy[];

  @Embedded(() => RangeEmb, {
    nullable: true,
  })
  @Embedded(() => RangeEmb, { nullable: true })
  education?: RangeEmb = new RangeEmb(-1, 10);

  @Property({ type: 'text[]' })
  maritalStatus?: MaritalStatus[];

  @Property({ type: 'int[]', nullable: true })
  restrictToProfessions?: number[];

  @Property({ type: 'int[]', nullable: true })
  excludeProfessions?: number[];

  @Property({ type: 'int[]', nullable: true })
  originCountries?: number[];
  // ancentral

  @Property({ type: 'int[]', nullable: true })
  grewupCountries?: number[];
  // spent most childhood and formative years

  @Property({ type: 'int[]', nullable: true })
  nationalitiesOf?: number[];
  //legal citizenship

  @Property({ type: 'int[]', nullable: true })
  basedInCountries?: number[];

  @Property({ type: 'int[]', nullable: true })
  ethniticities?: number[];

  @Property({ type: 'int[]', nullable: true })
  religions?: number[];

  @Property({ default: true, type: 'boolean' })
  allowReligionConvert?: boolean = true;

  @Property({ type: 'int[]', nullable: true })
  religionsSects?: number[];

  @Embedded(() => RangeEmb, { nullable: true })
  religiousLevel?: RangeEmb = new RangeEmb(1, 5);

  @Property({ type: 'int[]', nullable: true })
  interests?: number[];

  // @Property({ type: 'text[]' })
  // hasChildren: YesNo[] = Object.values(YesNo).filter(
  //   (item) => item !== YesNo.UNSURE,
  // );

  @Property({ type: 'text[]', nullable: true })
  gendersInterestedIn?: Gender[];

  @Embedded(() => RangeEmb, { nullable: true })
  hasChildren?: RangeEmb = new RangeEmb(1, 5);

  smoking?: RangeEmb = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb, { nullable: true })
  drinking?: RangeEmb = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb, { nullable: true })
  drug?: RangeEmb = new RangeEmb(-1, 7);

  @Property({ type: 'int', nullable: true })
  maxDistanceMile?: number;

  @Property({ default: false, type: 'boolean' })
  isFaceVerified?: boolean = false;

  @Property({ default: false, type: 'boolean' })
  isIdVerified?: boolean = false;

  @Property({ nullable: true })
  excludeAstroBelievers?: boolean = false;

  @Property({ nullable: true })
  useAstronology?: boolean = false;
  // note: it is nullable because of unpaid user - it won't be used. If paid user false or true would be meaningful. e.g for who doesn't believe in it, it would be false

  @Property({ nullable: true, default: false, type: 'boolean' })
  onlyBeSeenByCompatible?: boolean = false;
}
