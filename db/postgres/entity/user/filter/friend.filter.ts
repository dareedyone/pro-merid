import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { BaseProfileFilter } from '../../generic/base.profile-filter';
import { FriendLocationProfile } from '../../profile/friend-location.profile';

@Entity()
export class FriendFilter extends BaseProfileFilter {
  @OneToOne(
    () => FriendLocationProfile,
    (locationProfile) => locationProfile.friendFilter,
  )
  locationProfile!: FriendLocationProfile;

  @Property({ default: false })
  bff: boolean = false;

  @Property({ default: false })
  socialize: boolean = false;

  @Property({ type: 'int[]', nullable: true })
  focusedIntentions?: number[];
}
