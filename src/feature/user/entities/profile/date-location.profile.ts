import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
} from '@mikro-orm/core';
import { DateProfile } from './date.profile';
import { BaseLocationProfileEntity } from 'src/common/entities/base-location-profile.entity';
import { Media } from '../media.entity';
import { DateFilter } from '../user/filter/date.filter';

@Entity()
export class DateLocationProfile extends BaseLocationProfileEntity {
  @ManyToOne(() => DateProfile)
  dateProfile!: DateProfile;

  @OneToMany(() => Media, (media) => media.dateLocationProfile)
  media = new Collection<Media>(this);

  @OneToOne(() => DateFilter, (dateFilter) => dateFilter.locationProfile)
  dateFilter: DateFilter;
}
