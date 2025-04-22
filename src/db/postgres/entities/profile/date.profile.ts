import {
  Entity,
  Property,
  Enum,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
} from '@mikro-orm/core';

import { BaseTimeEntity } from '../generic/base.entity';
import { YesNo } from 'src/types/enums/other.enum';
import { RelationshipIntention } from 'src/types/enums/user.enum';
import { Personality } from '../user/character/personality.entity';
import { Relationship } from '../user/relationship.entity';
import { UserBiol } from '../user/user-biol.entity';
import { LocationProfile } from './location.profile';
import { User } from '../user/user.entity';

@Entity()
export class DateProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.dateProfile)
  user!: User;

  @Enum({
    items: () => RelationshipIntention,
    default: RelationshipIntention.UNKNOWN,
  })
  relationshipIntention!: RelationshipIntention;

  @Enum({
    items: () => YesNo,
    default: YesNo.UNSURE,
  })
  wantChildren!: YesNo;

  @Property({ nullable: true })
  hieghtVerified?: boolean = false;

  @OneToOne(() => Personality, (personality) => personality.dateProfile, {
    cascade: [Cascade.ALL],
  })
  personality?: Personality;

  @OneToOne(() => Relationship, (relationship) => relationship.user, {
    cascade: [Cascade.ALL],
  })
  relationship?: Relationship;

  @OneToOne(() => UserBiol, (biol) => biol.dateProfile, {
    cascade: [Cascade.ALL],
  })
  biol: UserBiol;

  @OneToMany(
    () => LocationProfile,
    (locationProfile) => locationProfile.datingProfile,
    { cascade: [Cascade.ALL] },
  )
  locationProfiles = new Collection<LocationProfile>(this);
}
