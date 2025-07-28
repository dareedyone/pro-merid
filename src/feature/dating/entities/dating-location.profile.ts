import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
} from '@mikro-orm/core';
import { DatingProfile } from './dating.profile';
import { BaseLocationProfileEntity } from 'src/common/entities/base-location-profile.entity';
import { Media } from '../../user/entities/media.entity';
import { DatingFilter } from './dating.filter';
import { User } from 'src/feature/user/entities/user/user.entity';

@Entity()
export class DatingLocationProfile extends BaseLocationProfileEntity {
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => DatingProfile)
  datingProfile!: DatingProfile;

  @OneToMany(() => Media, (media) => media.datingLocationProfile)
  media = new Collection<Media>(this);

  @OneToOne(
    () => DatingFilter,
    (datingFilter) => datingFilter.locationProfile,
    {
      nullable: true,
    },
  )
  datingFilter?: DatingFilter;
}
