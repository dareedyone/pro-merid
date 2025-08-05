import {
  Entity,
  Enum,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { DateIntention, Gender } from 'src/common/types/enums/user.enum';
import { DatingPersonality } from 'src/feature/dating/entities/dating.personality.entity';
import { DatingRelationship } from 'src/feature/dating/entities/dating-relationship.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingBiol } from './dating-biol.entity';
import { DatingLocationProfile } from './dating-location.profile';

@Entity()
export class DatingProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.datingProfile, { unique: true })
  user!: User;

  @Enum({
    items: () => DateIntention,
    default: DateIntention.UNKNOWN,
  })
  intention!: DateIntention;

  @Enum({ items: () => Gender, array: true, default: [] })
  interestedIn!: Gender[];

  @OneToOne(
    () => DatingPersonality,
    (personality) => personality.datingProfile,
    {
      cascade: [Cascade.ALL],
    },
  )
  personality?: DatingPersonality;

  @OneToOne(
    () => DatingRelationship,
    (relationship) => relationship.datingProfile,
    {
      cascade: [Cascade.ALL],
    },
  )
  relationship?: DatingRelationship;

  @OneToOne(() => DatingBiol, (biol) => biol.dateProfile, {
    cascade: [Cascade.ALL],
    nullable: true,
  })
  biol?: DatingBiol;

  @OneToMany(
    () => DatingLocationProfile,
    (locationProfile) => locationProfile.datingProfile,
    { cascade: [Cascade.ALL] },
  )
  locationProfiles = new Collection<DatingLocationProfile>(this);

  // three types of subscription
  // 1. free - no subscription - limited access to filters, likes, don't see who likes you
  // 2. premium - typical app sub - for a month, or 1 week. Allow control over all filter
  // 3. gold/platinum - result oreinted, within a specific time frame e.g 6 months, anchor, online advertisement of profile, 2-way match compatibility i.e only allow people you specify to see you and people who also sub or fill thier deets.  if matched, it gets cancelled. multiple proiles
  // avatar instead of picture for celeb ? personalityFirst ?

  @Property({ type: 'timestamptz' })
  controlEndsAt?: Date;

  @Property({ type: 'timestamptz' })
  trueFyndEndsAt?: Date;
}
