import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { BaseProfileFilter } from 'src/common/entities/base.profile-filter';
import { FriendProfile } from './friend.profile';

@Entity()
export class FriendFilter extends BaseProfileFilter {
  @OneToOne(() => FriendProfile, (friendProfile) => friendProfile.friendFilter)
  friendProfile!: FriendProfile;

  @Property({ default: false })
  bff: boolean = false;

  @Property({ default: false })
  socialize: boolean = false;

  @Property({ type: 'int[]', nullable: true })
  focusedIntentions?: number[];
}
