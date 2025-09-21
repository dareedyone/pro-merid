import {
  Entity,
  Property,
  OneToOne,
  Collection,
  OneToMany,
  ManyToMany,
} from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from '../../user/entities/user/user.entity';
import { FocusedIntention } from './focused-intention.entity';
import { Media } from 'src/feature/user/entities/media.entity';
import { FriendFilter } from './friend.filter';

@Entity()
export class FriendProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.friendProfile)
  user!: User;

  @Property({ default: false })
  bff: boolean = false;

  @Property({ default: false })
  socialize: boolean = false;

  @ManyToMany(() => FocusedIntention)
  focusedIntentions = new Collection<FocusedIntention>(this);

  @OneToMany(() => Media, (media) => media.user)
  media = new Collection<Media>(this);

  @OneToOne(() => FriendFilter, (friendFilter) => friendFilter.friendProfile, {
    nullable: true,
  })
  friendFilter?: FriendFilter;

  @Property({ nullable: true })
  controlEndsAt?: Date;
}
