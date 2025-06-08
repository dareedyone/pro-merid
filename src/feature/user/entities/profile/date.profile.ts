import {
  Entity,
  Enum,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
} from '@mikro-orm/core';

import { DateIntention, Gender } from 'src/common/types/enums/user.enum';
import { Relationship } from '../user/relationship.entity';
import { UserBiol } from '../user/user-biol.entity';
import { DateLocationProfile } from './date-location.profile';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from '../user/user.entity';
// import { RangeEmb } from 'src/common/entities/range.emb';
import { Personality } from '../user/character/personality.entity';

@Entity()
export class DateProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.dateProfile, { unique: true })
  user!: User;

  @Enum({
    items: () => DateIntention,
    default: DateIntention.UNKNOWN,
  })
  intention!: DateIntention;

  @Enum({ items: () => Gender, array: true, default: [] })
  interestedIn!: Gender[];

  // @Embedded(() => RangeEmb, { nullable: true })
  // wantChildren?: RangeEmb; // todo: might fit in with relationship

  // @Enum({
  //   items: () => PetPreference,
  //   default: PetPreference.NONE,
  //   nullable: true,
  // })
  // petPreference?: PetPreference; // might fit in with personality

  // if nothing is here then i could move relationship and or personality to user profile

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
    nullable: true,
  })
  biol?: UserBiol;

  @OneToMany(
    () => DateLocationProfile,
    (locationProfile) => locationProfile.dateProfile,
    { cascade: [Cascade.ALL] },
  )
  locationProfiles = new Collection<DateLocationProfile>(this);
}
