import { Entity, Property, ManyToOne, Embedded } from '@mikro-orm/core';
import { MaritalStatus } from 'src/common/types/enums/user.enum';
// import { YesNo } from 'src/types/enums/other.enum';
import { BaseTimeEntity } from './base.entity';
import { User } from '../user/user.entity';
import { RangeEmb } from './range.emb';

@Entity()
export abstract class BaseProfileFilter extends BaseTimeEntity {
  @ManyToOne(() => User)
  user!: User;

  @Embedded(() => RangeEmb)
  age = new RangeEmb(15, 150);

  @Property({ default: false, type: 'boolean' })
  isVerified?: boolean = false;

  @Embedded(() => RangeEmb)
  smoking = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  drinking = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  drug = new RangeEmb(-1, 7);

  @Embedded(() => RangeEmb)
  education = new RangeEmb(-1, 10);

  @Property({ type: 'text[]' })
  maritalStatus: MaritalStatus[] = Object.values(MaritalStatus);

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

  @Embedded(() => RangeEmb)
  hasChildren = new RangeEmb(1, 5);

  @Property({ nullable: true })
  beliefAstronology?: boolean = false;

  @Property({ nullable: true })
  useAstronology?: boolean = false;
  // note: it is nullable because of unpaid user - it won't be used. If paid user false or true would be meaningful. e.g for who doesn't believe in it, it would be false
}
