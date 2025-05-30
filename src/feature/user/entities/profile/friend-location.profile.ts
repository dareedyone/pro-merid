import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
} from '@mikro-orm/core';
import { FriendProfile } from './friend.profile';
import { Media } from '../media.entity';
import { BaseLocationProfileEntity } from 'src/common/entities/base-location-profile.entity';
import { FriendFilter } from '../user/filter/friend.filter';

@Entity()
export class FriendLocationProfile extends BaseLocationProfileEntity {
  @ManyToOne(() => FriendProfile)
  friendProfile!: FriendProfile;

  @OneToMany(() => Media, (media) => media.user)
  media = new Collection<Media>(this);

  @OneToOne(() => FriendFilter, (friendFilter) => friendFilter.locationProfile)
  friendFilter: FriendFilter;
}
