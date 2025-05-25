import {
  Entity,
  Property,
  Enum,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
  Embedded,
} from '@mikro-orm/core';
import { BaseTimeEntity } from '../generic/base.entity';
import { PetPreference, DateIntention } from 'src/common/types/enums/user.enum';
import { Personality } from '../user/character/personality.entity';
import { Relationship } from '../user/relationship.entity';
import { UserBiol } from '../user/user-biol.entity';
import { DateLocationProfile } from './date-location.profile';
import { User } from '../user/user.entity';
import { RangeEmb } from '../generic/range.emb';

@Entity()
export class DateProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.dateProfile)
  user!: User;

  @Enum({
    items: () => DateIntention,
    default: DateIntention.UNKNOWN,
  })
  intention!: DateIntention;

  @Embedded(() => RangeEmb)
  wantChildren = new RangeEmb(1, 5);

  @Enum({ items: () => PetPreference, default: PetPreference.NONE })
  petPreference!: PetPreference;

  @Property({ nullable: true })
  hieghtVerified?: boolean = false;

  @Property({ default: false })
  isCeleb: boolean = false;

  @OneToOne(() => Personality, (personality) => personality.dateProfile, {
    cascade: [Cascade.ALL],
  })
  personality?: Personality;

  @OneToOne(() => Relationship, (relationship) => relationship.dateProfile, {
    cascade: [Cascade.ALL],
  })
  relationship?: Relationship;

  @OneToOne(() => UserBiol, (biol) => biol.dateProfile, {
    cascade: [Cascade.ALL],
  })
  biol: UserBiol;

  @OneToMany(
    () => DateLocationProfile,
    (locationProfile) => locationProfile.dateProfile,
    { cascade: [Cascade.ALL] },
  )
  locationProfiles = new Collection<DateLocationProfile>(this);
}
