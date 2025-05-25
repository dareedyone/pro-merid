import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
} from '@mikro-orm/core';
import { FriendProfile } from './friend.profile';
import { BaseLocationProfileEntity } from '../generic/base-location-profile.entity';
import { FriendFilter } from '../user/filter/friend.filter';
import { Media } from '../media.entity';

@Entity()
export class FriendLocationProfile extends BaseLocationProfileEntity {
  @ManyToOne(() => FriendProfile)
  friendProfile!: FriendProfile;

  @OneToMany(() => Media, (media) => media.user)
  media = new Collection<Media>(this);

  @OneToOne(() => FriendFilter, (friendFilter) => friendFilter.locationProfile)
  friendFilter: FriendFilter;
}
