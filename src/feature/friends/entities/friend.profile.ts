import {
  Entity,
  Property,
  OneToOne,
  Collection,
  OneToMany,
  ManyToMany,
  ManyToOne,
} from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from '../../user/entities/user/user.entity';
import { FocusedIntention } from './focused-intention.entity';
import { Media } from 'src/feature/user/entities/media.entity';
import { FriendFilter } from './friend.filter';
import { Country } from 'src/feature/location/entities/country.entity';

@Entity()
export class FriendProfile extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.friendProfile)
  user!: User;

  @Property({ default: false })
  bff: boolean = false;

  @Property({ default: false })
  socialize: boolean = false;

  @Property({ nullable: true })
  bio?: string;

  @ManyToMany(() => FocusedIntention)
  focusedIntentions = new Collection<FocusedIntention>(this);

  @OneToOne(() => FriendFilter, (friendFilter) => friendFilter.friendProfile, {
    nullable: true,
  })
  friendFilter?: FriendFilter;

  @Property({ nullable: true })
  controlEndsAt?: Date;

  // Location fields (simplified for friends - no multiple location profiles)
  @Property({ default: false })
  usePinLocation?: boolean;

  @Property({ columnType: 'geometry(Point, 4326)' })
  point!: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  pinnedPoint?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Property({ nullable: true })
  location?: string;

  @Property({ nullable: true })
  pinnedLocation?: string;

  @ManyToOne(() => Country, { nullable: true })
  country?: Country;

  @ManyToOne(() => Country, { nullable: true })
  pinnedCountry?: Country;

  @Property({ default: false })
  hidePictures?: boolean;

  // Media relationship
  @OneToMany(() => Media, (media) => media.friendProfile)
  media = new Collection<Media>(this);
}
