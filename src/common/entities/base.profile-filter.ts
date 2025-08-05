import { Entity, Property, ManyToOne, Embedded } from '@mikro-orm/core';
import { MaritalStatus } from 'src/common/types/enums/user.enum';
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

  @Property({ default: false, type: 'boolean' })
  isVerified?: boolean = false;

  @Embedded(() => RangeEmb, {
    nullable: true,
  })
  smoking?: RangeEmb = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb, { nullable: true })
  drinking?: RangeEmb = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb, { nullable: true })
  drug?: RangeEmb = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb, { nullable: true })
  education?: RangeEmb = new RangeEmb(-1, 10);

  @Property({ type: 'int', nullable: true })
  maxDistanceMile?: number;

  @Property({ type: 'text[]' })
  maritalStatus?: MaritalStatus[];

  @Property({ type: 'int[]', nullable: true })
  restrictToProfessions?: number[];

  @Property({ type: 'int[]', nullable: true })
  excludeProfessions?: number[];

  @Property({ type: 'int[]', nullable: true })
  originCountries?: number[];

  @Property({ type: 'int[]', nullable: true })
  grewupCountries?: number[];

  @Property({ type: 'int[]', nullable: true })
  nationalitiesOf?: number[]; // move country and thnic to base drd todo

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

  // @Property({ type: 'text[]' })
  // hasChildren: YesNo[] = Object.values(YesNo).filter(
  //   (item) => item !== YesNo.UNSURE,
  // );

  @Embedded(() => RangeEmb, { nullable: true })
  hasChildren?: RangeEmb = new RangeEmb(1, 5);

  @Property({ nullable: true })
  beliefAstronology?: boolean = false;

  @Property({ nullable: true })
  useAstronology?: boolean = false;
  // note: it is nullable because of unpaid user - it won't be used. If paid user false or true would be meaningful. e.g for who doesn't believe in it, it would be false
}
