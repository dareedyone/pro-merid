import {
  Entity,
  Property,
  OneToOne,
  Cascade,
  Collection,
  OneToMany,
  ManyToMany,
} from '@mikro-orm/core';

import { FriendLocationProfile } from './friend-location.profile';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from '../user/user.entity';
import { FocusedIntention } from '../user/character/focused-intention.entity';

@Entity()
export class FriendProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.dateProfile)
  user!: User;

  @Property({ default: false })
  bff: boolean = false;

  @Property({ default: false })
  socialize: boolean = false;

  @ManyToMany(() => FocusedIntention)
  focusedIntentions = new Collection<FocusedIntention>(this);

  @OneToMany(
    () => FriendLocationProfile,
    (locationProfile) => locationProfile.friendProfile,
    { cascade: [Cascade.ALL] },
  )
  locationProfiles = new Collection<FriendLocationProfile>(this);
}
