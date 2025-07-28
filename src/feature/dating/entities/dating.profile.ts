import {
  Entity,
  Enum,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
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

  // @Embedded(() => RangeEmb, { nullable: true })
  // wantChildren?: RangeEmb; // todo: might fit in with relationship

  // @Enum({
  //   items: () => PetPreference,
  //   default: PetPreference.NONE,
  //   nullable: true,
  // })
  // petPreference?: PetPreference; // might fit in with personality

  // if nothing is here then i could move relationship and or personality to user profile

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
}
